import { prismaClient } from "../app/database";
import { ResponseError } from "../error/response-error";
import {
  BenefitResponse,
  CraeteBenefitRequest,
  toBenefitResponse,
} from "../model/benefit-model";
import { toFacilityResponse } from "../model/facility-model";
import { BenefitValidation } from "../validation/benefit-validation";
import { Validation } from "../validation/validation";

export class BenefitService {
  static async create(
    request: CraeteBenefitRequest,
    facilityId: string,
    ownerId: string
  ): Promise<BenefitResponse> {
    const createRequest = Validation.validate(
      BenefitValidation.CREATE,
      request
    );

    const facility = await prismaClient.facility.findUnique({
      where: {
        id: facilityId,
      },
      include: {
        owner: true,
      },
    });

    const isOwner = facility?.owner_id === ownerId;

    if (!isOwner) {
      throw new ResponseError(403, "Forbidden");
    }

    if (!facility) {
      throw new ResponseError(404, "Facility not found");
    }

    const benefitCount = await prismaClient.benefit.count({
      where: {
        facility_id: facilityId,
      },
    });

    if (benefitCount >= 5) {
      throw new ResponseError(400, "Facility has reached the maximum benefits");
    }

    const benefit = await prismaClient.benefit.create({
      data: {
        ...createRequest,
        facility_id: facilityId,
      },
    });

    return toBenefitResponse(benefit);
  }

  static async get(facilityId: string): Promise<BenefitResponse[]> {
    const benefits = await prismaClient.benefit.findMany({
      where: {
        facility_id: facilityId,
      },
    });

    if (benefits.length === 0) {
      throw new ResponseError(404, "Benefits not found");
    }

    return benefits.map(toBenefitResponse);
  }
}