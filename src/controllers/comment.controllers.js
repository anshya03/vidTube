import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Comment } from "../models/comment.models.js"
import { Like } from "../models/like.models.js"
import mongoose, { isValidObjectId } from "mongoose"

// Add a comment to a video
const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    return res.status(201).json(
        new ApiResponse(201, comment, "Comment added successfully")
    )
})

// Update your comment
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required")
    }

    // Find comment
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    // Check ownership
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can't edit this comment")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { $set: { content } },
        { new: true }
    )

    return res.status(200).json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
    )
})

// Delete your comment
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    // Check ownership
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can't delete this comment")
    }

    await Comment.findByIdAndDelete(commentId)

    // Delete all likes on this comment too
    await Like.deleteMany({ comment: commentId })

    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    )
})

// Get all comments for a video with pagination
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const pipeline = [
        // Step 1: Get comments for this video
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        // Step 2: Get owner details
        {
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
        // Step 3: Get likes on each comment
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        // Step 4: Add computed fields
        {
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
        // Step 5: Return only needed fields
        {
            $project: {
                content: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1,
                createdAt: 1
            }
        },
        // Step 6: Sort newest first
        {
            $sort: { createdAt: -1 }
        },
        // Step 7: Pagination
        { $skip: (page - 1) * limit },
        { $limit: parseInt(limit) }
    ]

    const comments = await Comment.aggregate(pipeline)

    return res.status(200).json(
        new ApiResponse(200, {
            comments,
            pagination: {
                currentPage: parseInt(page),
                totalComments: comments.length,
                hasNextPage: comments.length === parseInt(limit)
            }
        }, "Comments fetched successfully")
    )
})

export {
    addComment,
    updateComment,
    deleteComment,
    getVideoComments
}