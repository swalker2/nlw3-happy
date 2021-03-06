import jwt from "jsonwebtoken";
import config from "./config";
import User from "../models/User";

export default (user: User) => jwt.sign(
    JSON.stringify(user),
    config.app.key
    // {expiresIn: 86400}
)
