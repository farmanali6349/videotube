import multer from "multer";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../public/temp"));
  },
  filename: function (req, file, cb) {
    const fileExtention = path.extname(file.originalname);
    crypto.randomBytes(6, (err, raw) => {
      if (err) return cb(err);

      const fileName = raw.toString("hex") + fileExtention;

      return cb(null, fileName);
    });
  },
});

const upload = multer({ storage });

export { upload };
