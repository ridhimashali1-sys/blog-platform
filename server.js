const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

// ================= MIDDLEWARE =================

app.use(cors());
app.use(express.json());

// ================= MONGODB CONNECTION =================

mongoose
  .connect(
    "mongodb+srv://admin:admin123@cluster0.m3ydaq7.mongodb.net/authDB?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.log(err);
  });

// ================= POST SCHEMA =================

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
});

const Post = mongoose.model("Post", postSchema);

// ================= USER SCHEMA =================

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

// ================= AUTH MIDDLEWARE =================

const authMiddleware = (req, res, next) => {
  try {
    // Get token from headers
    const token = req.headers.token;

    // Check token exists
    if (!token) {
      return res.status(401).json({
        msg: "No token found",
      });
    }

    // Verify token
    const verified = jwt.verify(token, "secretkey");

    // Save user data
    req.user = verified;

    // Continue
    next();

  } catch (err) {
    console.log(err);

    res.status(401).json({
      msg: "Invalid Token",
    });
  }
};

// ================= ROUTES =================

// Home Route
app.get("/", (req, res) => {
  res.send("Backend Working");
});

// Test Route
app.get("/test", (req, res) => {
  res.send("Test Working");
});

// ================= AUTH ROUTES =================

// Register User
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.json({
        msg: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.json({
      msg: "User Registered Successfully",
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Server Error",
    });
  }
});

// Login User
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        msg: "User not found",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({
        msg: "Invalid credentials",
      });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user._id,
      },
      "secretkey",
      {
        expiresIn: "1d",
      }
    );

    res.json({
      msg: "Login Successful",
      token,
      user,
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Server Error",
    });
  }
});

// ================= BLOG ROUTES =================

// Create Post
app.post("/create-post", authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;

    const newPost = new Post({
      title,
      content,
    });

    await newPost.save();

    res.json({
      msg: "Post Created Successfully",
      post: newPost,
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Server Error",
    });
  }
});

// Get All Posts
app.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find();

    res.json(posts);

  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Server Error",
    });
  }
});

// Update Post
app.put("/update-post/:id", authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
      },
      { new: true }
    );

    res.json({
      msg: "Post Updated Successfully",
      updatedPost,
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Server Error",
    });
  }
});

// Delete Post
app.delete("/delete-post/:id", authMiddleware, async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);

    if (!deletedPost) {
      return res.status(404).json({
        msg: "Post Not Found",
      });
    }

    res.json({
      msg: "Post Deleted Successfully",
      deletedPost,
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Server Error",
    });
  }
});

// ================= START SERVER =================

app.listen(8000, () => {
  console.log("Server running on port 8000");
});