import { Router } from 'express';
import { getCapsules, createCapsule } from '../controllers/capsuleController';

const router = Router();

router.get('/', getCapsules);
router.post('/', createCapsule);

export default router;
