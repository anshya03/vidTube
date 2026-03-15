import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { Like } from "../models/like.models.js"
import { Comment } from "../models/comment.models.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        query, 
        sortBy = "createdAt", 
        sortType = "desc", 
        userId 
    } = req.query

    // Step 1: Build the pipeline
    const pipeline = []

    // Step 2: Search by title or description
    if (query) {
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } }
                ]
            }
        })
    }

    // Step 3: Filter by userId if provided
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID")
        }
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        })
    }

    // Step 4: Only show published videos
    pipeline.push({
        $match: { isPublished: true }
    })

    // Step 5: Join with users to get owner details
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
            pipeline: [
                {
                    $project: {
                        username: 1,
                        fullname: 1,
                        avatar: 1
                    }
                }
            ]
        }
    })

    // Step 6: Flatten owner array
    pipeline.push({
        $addFields: {
            owner: { $first: "$owner" }
        }
    })

    // Step 7: Sort
    pipeline.push({
        $sort: {
            [sortBy]: sortType === "asc" ? 1 : -1
        }
    })

    // Step 8: Pagination
    const skip = (page - 1) * limit

    pipeline.push({ $skip: skip })
    pipeline.push({ $limit: parseInt(limit) })

    // Step 9: Execute pipeline
    const videos = await Video.aggregate(pipeline)

    // Step 10: Get total count for pagination metadata
    const totalVideos = await Video.countDocuments({
        isPublished: true,
        ...(query && {
            $or: [
                { title: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } }
            ]
        })
    })

    return res.status(200).json(
        new ApiResponse(200, {
            videos,
            pagination: {
                totalVideos,
                totalPages: Math.ceil(totalVideos / limit),
                currentPage: parseInt(page),
                hasNextPage: page * limit < totalVideos,
                hasPrevPage: page > 1
            }
        }, "Videos fetched successfully")
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required")
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if (!videoLocalPath) throw new ApiError(400, "Video file is required")
    if (!thumbnailLocalPath) throw new ApiError(400, "Thumbnail is required")

    let videoFile;
    try {
        videoFile = await uploadOnCloudinary(videoLocalPath)
    } catch (error) {
        throw new ApiError(500, "Failed to upload video")
    }

    let thumbnail;
    try {
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    } catch (error) {
        if (videoFile) await deleteFromCloudinary(videoFile.public_id)
        throw new ApiError(500, "Failed to upload thumbnail")
    }

    try {
        const video = await Video.create({
            title,
            description,
            videoFile: videoFile.url,
            thumbnail: thumbnail.url,
            duration: videoFile.duration,
            owner: req.user._id,
            isPublished: true
        })

        return res.status(201).json(
            new ApiResponse(201, video, "Video uploaded successfully")
        )
    } catch (error) {
        if (videoFile) await deleteFromCloudinary(videoFile.public_id)
        if (thumbnail) await deleteFromCloudinary(thumbnail.public_id)
        throw new ApiError(500, "Failed to save video")
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    // Step 1: Check if videoId is valid MongoDB ObjectId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Step 2: Increment view count atomically
    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } })

    // Step 3: Fetch video with owner details using aggregation
    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            // Join with users collection to get owner details
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            // Join with likes collection to get like count
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            // Add computed fields
            $addFields: {
                owner: { $first: "$owner" },
                likesCount: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            // Return only needed fields
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                views: 1,
                duration: 1,
                isPublished: 1,
                createdAt: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1
            }
        }
    ])

    // Step 4: Check video exists
    if (!video.length) {
        throw new ApiError(404, "Video not found")
    }

    // Step 5: Add to watch history
    await User.findByIdAndUpdate(
        req.user?._id,
        { $addToSet: { watchHistory: videoId } }
    )

    return res.status(200).json(
        new ApiResponse(200, video[0], "Video fetched successfully")
    )
})
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body

    // Step 1: Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Step 2: Check video exists and requester is the owner
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can't edit this video")
    }

    // Step 3: Handle thumbnail update if new one uploaded
    let thumbnailUrl = video.thumbnail // keep old one by default
    const thumbnailLocalPath = req.file?.path

    if (thumbnailLocalPath) {
        // Upload new thumbnail
        let newThumbnail;
        try {
            newThumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        } catch (error) {
            throw new ApiError(500, "Failed to upload new thumbnail")
        }

        // Delete old thumbnail from Cloudinary
        await deleteFromCloudinary(video.thumbnail)

        thumbnailUrl = newThumbnail.url
    }

    // Step 4: Update video in MongoDB
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title: title || video.title,
                description: description || video.description,
                thumbnail: thumbnailUrl
            }
        },
        { new: true }
    )

    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    // Step 1: Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Step 2: Find video
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Step 3: Check ownership
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can't delete this video")
    }

    // Step 4: Delete video file and thumbnail from Cloudinary
    try {
        await deleteFromCloudinary(video.videoFile)
        await deleteFromCloudinary(video.thumbnail)
    } catch (error) {
        throw new ApiError(500, "Failed to delete files from Cloudinary")
    }

    // Step 5: Delete the video from MongoDB
    await Video.findByIdAndDelete(videoId)

    // Step 6: Delete all likes on this video
    await Like.deleteMany({ video: videoId })

    // Step 7: Delete all comments on this video
    await Comment.deleteMany({ video: videoId })

    return res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    // Step 1: Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Step 2: Find video
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Step 3: Check ownership
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can't toggle this video")
    }

    // Step 4: Flip the boolean
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video.isPublished
            }
        },
        { new: true }
    )

    return res.status(200).json(
        new ApiResponse(
            200,
            { isPublished: updatedVideo.isPublished },
            `Video is now ${updatedVideo.isPublished ? "published" : "unpublished"}`
        )
    )
})


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}