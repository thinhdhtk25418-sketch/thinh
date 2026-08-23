import { Request, Response } from 'express';
import { prisma } from '../db';
import { createEssaySchema, updateEssaySchema, gradeEssaySchema } from '../schemas';

export const getEssays = async (req: Request, res: Response) => {
  try {
    const { studentName, status } = req.query;
    
    const whereClause: any = {};
    if (studentName) whereClause.studentName = String(studentName);
    if (status) whereClause.status = String(status);

    const essays = await prisma.essay.findMany({
      where: whereClause,
      include: { prompt: true },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(essays);
  } catch (error) {
    console.error("GET /essays error:", error);
    res.status(500).json({ error: 'Failed to fetch essays' });
  }
};

export const getEssay = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const essay = await prisma.essay.findUnique({
      where: { id },
      include: { prompt: true }
    });
    if (!essay) {
      res.status(404).json({ error: 'Essay not found' });
      return;
    }
    res.json(essay);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch essay' });
  }
};

export const createEssay = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = createEssaySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors });
      return;
    }

    const dataToCreate: any = { ...parseResult.data };
    if (dataToCreate.status === 'submitted') {
      dataToCreate.submittedAt = new Date();
    }

    const essay = await prisma.essay.create({
      data: dataToCreate
    });
    res.status(201).json(essay);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create essay' });
  }
};

export const updateEssay = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parseResult = updateEssaySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors });
      return;
    }

    const dataToUpdate: any = { ...parseResult.data };
    if (dataToUpdate.status === 'submitted') {
      dataToUpdate.submittedAt = new Date();
    }

    const essay = await prisma.essay.update({
      where: { id },
      data: dataToUpdate
    });
    res.json(essay);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update essay' });
  }
};

export const gradeEssay = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parseResult = gradeEssaySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors });
      return;
    }

    const dataToUpdate: any = { ...parseResult.data };
    if (dataToUpdate.status === 'graded') {
      dataToUpdate.gradedAt = new Date();
    }

    // annotations is received as object/array, prisma Json field handles it
    const essay = await prisma.essay.update({
      where: { id },
      data: dataToUpdate
    });
    res.json(essay);
  } catch (error) {
    res.status(500).json({ error: 'Failed to grade essay' });
  }
};

export const deleteEssay = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.essay.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete essay' });
  }
};
