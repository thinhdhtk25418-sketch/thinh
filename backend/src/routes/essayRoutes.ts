import { Router } from 'express';
import { getEssays, getEssay, createEssay, updateEssay, gradeEssay, deleteEssay } from '../controllers/essayController';

const router = Router();

router.get('/', getEssays);
router.get('/:id', getEssay);
router.post('/', createEssay);
router.put('/:id', updateEssay);
router.put('/:id/grade', gradeEssay);
router.delete('/:id', deleteEssay);

export const essayRoutes = router;
