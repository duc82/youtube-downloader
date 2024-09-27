import express from "express";
import videoRouter from "./routes/video.route";
import path from "path";
import fs from "fs";

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use("/", express.static("public"));

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/download", (req, res) => {
  const path = req.query.path as string;

  if (!path) {
    return res.status(400).json({ message: "Path is required" });
  }

  if (!fs.existsSync(`${process.cwd()}/public${path}`)) {
    return res.status(404).json({ message: "File not found" });
  }

  res.render("download", { path });
});

app.use("/api/videos", videoRouter);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
