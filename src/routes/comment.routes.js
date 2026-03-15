import { Router } from "express"
import {
    addComment,
    updateComment,
    deleteComment,
    getVideoComments
} from "../controllers/comment.controllers.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js"

const router = Router()

router.route("/:videoId").get(verifyJWT, getVideoComments)
router.route("/:videoId").post(verifyJWT, addComment)
router.route("/c/:commentId").patch(verifyJWT, updateComment)
router.route("/c/:commentId").delete(verifyJWT, deleteComment)

export default router

