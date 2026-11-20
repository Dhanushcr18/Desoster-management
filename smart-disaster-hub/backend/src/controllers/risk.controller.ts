import { Request, Response } from 'express';
import Road from '../models/Road.model';
import { assessAllRoads, assessRoad } from '../services/risk.service';

export const getRoadRisks = async (req: Request, res: Response): Promise<void> => {
  try {
    const roads = await Road.findAll({
      order: [['riskScore', 'DESC']],
    });
    res.json(roads);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to retrieve road risk assessments', error: err.message });
  }
};

export const assessAllRoadRisks = async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await assessAllRoads();
    res.json({
      message: `Risk assessment completed across ${updated.length} corridors`,
      roads: updated,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Risk assessment cycle failed', error: err.message });
  }
};

export const assessSingleRoadRisk = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const road = await Road.findByPk(id);
    if (!road) {
      res.status(404).json({ message: 'Road not found' });
      return;
    }

    const assessment = await assessRoad(road);
    road.riskScore = assessment.riskScore;
    road.riskLevel = assessment.riskLevel;
    road.riskReason = assessment.riskReason;
    road.rainfall24h = assessment.rainfall24h;
    road.rainfall48h = assessment.rainfall48h;
    road.peakHourlyRain = assessment.peakHourlyRain;
    road.minElevation = assessment.minElevation ?? undefined;
    road.riverDischargeRatio = assessment.riverDischargeRatio ?? undefined;
    road.lastAssessedAt = new Date();
    await road.save();

    res.json(road);
  } catch (err: any) {
    res.status(500).json({ message: 'Single road assessment failed', error: err.message });
  }
};
