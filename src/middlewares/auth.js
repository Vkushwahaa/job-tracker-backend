// import jwt from "jsonwebtoken";

// export const auth = (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res
//         .status(401)
//         .json({ messege: "either no token || invalid format" });
//     }
//     if (!token) return res.status(401).json({ message: "No token provided" });
//     const token = authHeader.split(" ")[1];
//     // const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

//     req.userId = decoded.userId;
//     console.log("AUTH HEADER:", req.headers.authorization);

//     next();
//   } catch (err) {
//     return res.status(401).json({ messege: "invalid || token expired" });
//   }
// };

import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)

        .json({ message: "Missing or invalid auth header" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("AUTH CHECK:", {
      now: Math.floor(Date.now() / 1000),
      exp: decoded.exp,
      diff: decoded.exp - Math.floor(Date.now() / 1000),
    });
    // req.userId = decoded.userId;
    req.user = decoded;

    console.log("JWT DECODED:", decoded);

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
