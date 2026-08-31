import { Request, Response } from 'express';
import pool from '../config/db';
import { Capsule, CapsuleResponse, CreateCapsuleRequest, PaginatedResponse } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const getCapsules = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM capsules'
    );
    const total = countResult[0].total;

    // Get capsules ordered by created_at DESC
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM capsules ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    const now = new Date();
    const capsules: CapsuleResponse[] = (rows as Capsule[]).map(capsule => {
      const isUnlocked = new Date(capsule.unlock_time) <= now;
      return {
        id: capsule.id,
        content: isUnlocked ? capsule.content : null,
        author: capsule.author,
        unlock_time: capsule.unlock_time.toISOString(),
        created_at: capsule.created_at.toISOString(),
        is_unlocked: isUnlocked
      };
    });

    const response: PaginatedResponse<CapsuleResponse> = {
      data: capsules,
      hasMore: offset + limit < total,
      total
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching capsules:', error);
    res.status(500).json({ error: 'Failed to fetch capsules' });
  }
};

export const createCapsule = async (req: Request, res: Response) => {
  try {
    const { content, author, unlock_time }: CreateCapsuleRequest = req.body;

    if (!content || !unlock_time) {
      res.status(400).json({ error: 'Content and unlock_time are required' });
      return;
    }

    const unlockDate = new Date(unlock_time);
    if (unlockDate <= new Date()) {
      res.status(400).json({ error: 'Unlock time must be in the future' });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO capsules (content, author, unlock_time) VALUES (?, ?, ?)',
      [content, author || '匿名', unlockDate]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Capsule created successfully'
    });
  } catch (error) {
    console.error('Error creating capsule:', error);
    res.status(500).json({ error: 'Failed to create capsule' });
  }
};
