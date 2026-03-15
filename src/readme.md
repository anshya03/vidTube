VidTube — YouTube-like Backend API
A production-grade REST API backend built with Node.js, Express, and MongoDB — supporting video upload, comments, likes, subscriptions, and authentication.

🚀 Live Demo
Base URL: https://your-app.railway.app/api/v1

🛠 Tech Stack

Runtime: Node.js
Framework: Express.js
Database: MongoDB Atlas (Mongoose)
Media Storage: Cloudinary
Authentication: JWT (Access + Refresh Tokens)
File Uploads: Multer
Password Hashing: Bcrypt


✨ Features

JWT Authentication with Access + Refresh Token rotation
Video upload with automatic duration extraction via Cloudinary
Nested comment system with pagination
Like/Unlike toggle for videos and comments
Subscribe/Unsubscribe to channels
Watch history tracking
Channel profile with subscriber count
Search, sort, and paginate videos
Aggregation pipelines for feed and analytics
Centralized error handling
Input validation throughout


📁 Project Structure
src/
├── controllers/
│   ├── user.controllers.js
│   ├── video.controllers.js
│   ├── comment.controllers.js
│   ├── like.controllers.js
│   └── subscription.controllers.js
├── models/
│   ├── user.models.js
│   ├── video.models.js
│   ├── comment.models.js
│   ├── like.models.js
│   └── subscription.models.js
├── middlewares/
│   ├── auth.middlewares.js
│   ├── multer.middlewares.js
│   └── error.middlewares.js
├── routes/
│   ├── user.routes.js
│   ├── video.routes.js
│   ├── comment.routes.js
│   ├── like.routes.js
│   └── subscription.routes.js
├── utils/
│   ├── asyncHandler.js
│   ├── ApiError.js
│   ├── ApiResponse.js
│   └── cloudinary.js
├── db/
│   └── index.js
└── app.js

⚙️ Environment Variables
Create a .env file in the root directory:
envPORT=8000
MONGODB_URI=your_mongodb_atlas_uri
CORS_ORIGIN=*

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d

REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

🚀 Running Locally
bash# Clone the repository
git clone https://github.com/anshya03/vidtube

# Install dependencies
cd vidtube
npm install

# Set up environment variables
cp .env.example .env
# Fill in your values in .env

# Start development server
npm run dev
Server runs at http://localhost:8000

📡 API Endpoints
Auth & Users
MethodEndpointAuthDescriptionPOST/api/v1/users/register❌Register with avatar uploadPOST/api/v1/users/login❌Login with email/passwordPOST/api/v1/users/logout✅Logout userPOST/api/v1/users/refresh-token❌Refresh access tokenGET/api/v1/users/current-user✅Get logged in userPATCH/api/v1/users/update-account✅Update name and emailPATCH/api/v1/users/avatar✅Update avatarPATCH/api/v1/users/cover-image✅Update cover imagePOST/api/v1/users/change-password✅Change passwordGET/api/v1/users/c/:username✅Get channel profileGET/api/v1/users/watch-history✅Get watch history
Videos
MethodEndpointAuthDescriptionGET/api/v1/videos❌Get all videos (search, sort, paginate)POST/api/v1/videos✅Upload videoGET/api/v1/videos/:videoId❌Get video by IDPATCH/api/v1/videos/:videoId✅Update videoDELETE/api/v1/videos/:videoId✅Delete videoPATCH/api/v1/videos/toggle/publish/:videoId✅Toggle publish status
Comments
MethodEndpointAuthDescriptionGET/api/v1/comments/:videoId✅Get video commentsPOST/api/v1/comments/:videoId✅Add commentPATCH/api/v1/comments/c/:commentId✅Update commentDELETE/api/v1/comments/c/:commentId✅Delete comment
Likes
MethodEndpointAuthDescriptionPOST/api/v1/likes/toggle/v/:videoId✅Toggle video likePOST/api/v1/likes/toggle/c/:commentId✅Toggle comment likePOST/api/v1/likes/toggle/t/:tweetId✅Toggle tweet likeGET/api/v1/likes/videos✅Get liked videos
Subscriptions
MethodEndpointAuthDescriptionPOST/api/v1/subscriptions/c/:channelId✅Toggle subscriptionGET/api/v1/subscriptions/c/:channelId✅Get channel subscribersGET/api/v1/subscriptions/u/:subscriberId✅Get subscribed channels

🔐 Authentication
This API uses JWT Bearer token authentication.
Login to get tokens:
POST /api/v1/users/login
Use access token in headers:
Authorization: Bearer <your_access_token>
Refresh when access token expires:
POST /api/v1/users/refresh-token
Body: { "refreshToken": "your_refresh_token" }

📊 Key Design Decisions
Unified Like Model — One Like collection handles video, comment, and tweet likes using nullable foreign keys. Reduces code duplication and simplifies the schema.
Refresh Token Rotation — Every token refresh generates a new refresh token, invalidating the old one. Prevents token reuse after logout.
Aggregation Pipelines — Channel profiles, video feeds, and watch history use MongoDB aggregation pipelines for efficient single-query data fetching with joins.
Cleanup on Failure — If database operations fail after Cloudinary uploads, orphaned files are automatically deleted to prevent storage waste.

📬 Postman Collection
Import the collection to test all endpoints:
Download Postman Collection ← add your exported collection link here

👨‍💻 Author
Anshya Kachroo

GitHub: @anshya03
Email: anshyakachroo@gmail.com
Website: anshya.me