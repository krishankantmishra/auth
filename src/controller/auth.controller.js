const userModel = require("../module/user.module");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sessionModel = require("../module/session.module");

exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const userExists = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (userExists) {
      return res.status(400).json({
        message: "user already exists",
      });
    }

    const hash = await crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const user = new userModel({ username, email, password: hash });
    await user.save();

    const refreshToken = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const session = await sessionModel.create({
      user: user._id,
      refreshToken: refreshTokenHash,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    const accessToken = jwt.sign(
      {
        id: user._id,
        session: session._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      },
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        username,
        email,
      },
      accessToken: accessToken,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};

exports.logIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const isPasswordMatched =
      crypto.createHash("sha256").update(password).digest("hex") ===
      user.password;

    if (!isPasswordMatched) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const session = await sessionModel.create({
      user: user._id,
      refreshToken: refreshTokenHash, // This was missing!
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    const accessToken = jwt.sign(
      { id: user._id, 
        session: session._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    // 4. Set Cookie and Send Response
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Logged in successfully",
      accessToken,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};

exports.profile = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "No token in cookies" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const incomingHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const session = await sessionModel.findOne({
      refreshToken: incomingHash,
      revoked: false,
    });

    if (!session) {
      return res.status(401).json({
        message: "Invalid refresh token: Session not found in database",
      });
    }

    const newAccessToken = jwt.sign(
      {
        id: decoded.id,
        session: session._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      },
    );

    const newRefreshToken = jwt.sign(
      {
        id: decoded.id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    const newRefreshTokenHash = crypto
      .createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");

    session.refreshToken = newRefreshTokenHash;
    await session.save();

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};

exports.logOut = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "You are not authenticated" });
    }

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    const session = await sessionModel.findOne({
      refreshToken: refreshTokenHash,
      revoked: false,
    });

    if (session) {
      session.revoked = true;
      await session.save();
    }

    res.clearCookie("refreshToken");

    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};

exports.logOutAll = async (req, res) => {
  try {
    const userId = req.user.id;

    await sessionModel.updateMany({ user: userId }, { revoked: true });
    res.clearCookie("refreshToken");

    res.status(200).json({
      message: "Logged out from all devices successfully",
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};
