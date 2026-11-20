import { Request, Response } from 'express';
import {
  startReplay,
  pauseReplay,
  stopReplay,
  getReplayStatus,
  getReplayComparison,
} from '../services/replay.service';

export const handleStartReplay = async (req: Request, res: Response): Promise<void> => {
  try {
    const { scenario = 'kerala-2018', speed = 2 } = req.body;
    const status = await startReplay(scenario, speed);
    res.json({ message: `Replay scenario ${scenario} started`, status });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to start replay', error: err.message });
  }
};

export const handlePauseReplay = (req: Request, res: Response): void => {
  try {
    const status = pauseReplay();
    res.json({ message: 'Replay paused', status });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to pause replay', error: err.message });
  }
};

export const handleStopReplay = (req: Request, res: Response): void => {
  try {
    const status = stopReplay();
    res.json({ message: 'Replay stopped', status });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to stop replay', error: err.message });
  }
};

export const handleGetReplayStatus = (req: Request, res: Response): void => {
  try {
    const status = getReplayStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to get replay status', error: err.message });
  }
};

export const handleGetComparison = async (req: Request, res: Response): Promise<void> => {
  try {
    const scenario = (req.query.scenario as string) || 'kerala-2018';
    const comparison = await getReplayComparison(scenario);
    res.json(comparison);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to get replay comparison', error: err.message });
  }
};
