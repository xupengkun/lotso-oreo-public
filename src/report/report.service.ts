import { Injectable } from '@nestjs/common';

import { MONGO_CONFIG_LABA_DB_NAME } from 'src/config';
import { CollectionName as QuestionnaireCollectionName, QuestionnaireDocument } from '../questionnaire/questionnaire.db';
import { CollectionName as GameCollectionName, GameDocument } from '../game/game.db';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReportGameParams, ReportGameResponse, ReportQuestionnaireParams, ReportQuestionnaireResponse } from './report.type';


@Injectable()
export class ReportService {

  constructor(
    @InjectModel(QuestionnaireCollectionName, MONGO_CONFIG_LABA_DB_NAME)
    private readonly questionnaireCollectionModel: Model<QuestionnaireDocument>,

    @InjectModel(GameCollectionName, MONGO_CONFIG_LABA_DB_NAME)
    private readonly gameCollectionModel: Model<GameDocument>,
  ) {}

  async game(startTime: number, endTime: number, otherParams ?: ReportGameParams): Promise<ReportGameResponse> {
    console.log('查询报表：', startTime, endTime, otherParams);
    // https://mongoosejs.com/
    const result: any = await this.gameCollectionModel.aggregate([
      {
        $match: {
          "createtime": {
            $gte: startTime,
            $lte: endTime
          },
          ...otherParams
        }
      },
      {
        $project: {
          _id: 0,
          userid: 1,
          createtime: 1,
          hasprizes: 1,
          platformaddress: 1,
          prizesid: 1,
          taskid: 1,
        }
      },
      {
        $lookup: {
          from: 'questionnaires',
          as: 'questionnaires',
          let: {
            "userid": "$userid",
            "platformaddress": "$platformaddress"
          },
          pipeline: [
            {
              $project: {
                _id: 0,
                userid: 1,
                createtime: 1,
                device: 1,
                version: 1,
                reciveCoupon: 1,
              }
            },
            {
              $match: {
                "version": 1,
                "$expr": {
                  "$and": [
                    {
                      "$eq": [
                        "$userid",
                        "$$userid"
                      ]
                    },
                    {
                      "$eq": [
                        "$device",
                        "$$platformaddress"
                      ]
                    }
                  ]
                }
              },
            },
          ]
        },
      },
      {
        $unwind: {
          path: '$questionnaires',
          preserveNullAndEmptyArrays: true,
        }
      },
    ]);
    return {
      code: 200,
      message: '查询成功',
      data: result
    };
  }


  async form(startTime: number, endTime: number, otherParams ?: ReportQuestionnaireParams): Promise<ReportQuestionnaireResponse> {
    console.log('查询报表：', startTime, endTime, otherParams);
    // https://mongoosejs.com/
    const result: any = await this.questionnaireCollectionModel.aggregate([
      {
        $match: {
          "createtime": {
            $gte: startTime,
            $lte: endTime
          },
          ...otherParams
        }
      },
      // {
      //   $project: {
      //     _id: 0,
      //     userid: 1,
      //     createtime: 1,
      //     hasprizes: 1,
      //     platformaddress: 1,
      //     prizesid: 1,
      //     taskid: 1,
      //   }
      // },
    ]);
    return {
      code: 200,
      message: '查询成功',
      data: result
    };
  }

}
