import { Request, Response } from 'express';
import { prisma } from '../db';
import { createPromptSchema, updatePromptSchema } from '../schemas';

export const getPrompts = async (req: Request, res: Response) => {
  try {
    const taskFilter = req.query.task as string;
    const whereClause: any = {};
    if (taskFilter) {
      whereClause.task = taskFilter;
    }
    const prompts = await prisma.prompt.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
};

export const getPromptById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const prompt = await prisma.prompt.findUnique({ where: { id } });
    if (!prompt) {
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }
    res.json(prompt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prompt' });
  }
};

export const createPrompt = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = createPromptSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors });
      return;
    }
    
    let image = null;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    const prompt = await prisma.prompt.create({
      data: {
        ...parseResult.data,
        image
      }
    });
    res.status(201).json(prompt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create prompt' });
  }
};

export const updatePrompt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parseResult = updatePromptSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors });
      return;
    }
    
    let image = undefined;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    const prompt = await prisma.prompt.update({
      where: { id },
      data: {
        ...parseResult.data,
        ...(image && { image })
      }
    });
    res.json(prompt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update prompt' });
  }
};

export const deletePrompt = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.prompt.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete prompt' });
  }
};
