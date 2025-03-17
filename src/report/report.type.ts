import { GameSchemaType } from "src/game/game.db";
import { QuestionnaireSchemaType } from "src/questionnaire/questionnaire.db";
import { DefaultRequestReponseTypedef } from "src/types";

export type ReportGameParams = Partial<GameSchemaType>

export type ReportGameResponse = DefaultRequestReponseTypedef<Required<GameSchemaType>[]>

export type ReportQuestionnaireParams = Partial<QuestionnaireSchemaType>

export type ReportQuestionnaireResponse = DefaultRequestReponseTypedef<Required<QuestionnaireSchemaType>[]>