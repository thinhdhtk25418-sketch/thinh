import { Router } from 'express';
import multer from 'multer';
import { getPrompts, getPromptById, createPrompt, updatePrompt, deletePrompt } from '../controllers/promptController';
import path from 'path';

const router = Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

router.get('/', getPrompts);
router.get('/:id', getPromptById);
router.post('/', upload.single('image'), createPrompt);
router.put('/:id', upload.single('image'), updatePrompt);
router.delete('/:id', deletePrompt);

export const promptRoutes = router;
