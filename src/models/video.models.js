/*
owner ObjectId users
videoFile string
thumbnail string
title string
description string
duration number
views number
isPublished boolean
createdAt Date
updatedAt Date
*/

import mongoose, {Schema} from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';


const videoSchema=new Schema({
    videoFile:{
        type: String,//cloudinary url
        required: true
    },
    thumbnail:{
        type: String,//c;oudinary url
        required: true
    },
    title:{
        type: String,
        required: true,
        trim: true
    },
    description:{
        type: String,
        required: true,
        trim: true 
    },
    views:{
        type: Number,
        default: 0,
        required: true
    },
    duration:{
        type: Number,
        required: true
    },
    isPublished:{
        type: Boolean,
        default: true, 
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
  }

},
{    timestamps: true

})

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema)