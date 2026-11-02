import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import type { NgWordMatchType } from '../../../generated/graphql';
import { ADMIN_TOKEN_KEY } from './auth';

const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

export type NGWord = {
  ID: string;
  pattern: string;
  matchType: NgWordMatchType;
  createdAt: string;
};

export type NGWordStats = {
  total: number;
  byWord: { pattern: string; count: number }[];
  byUser: { userID: string; name: string; accountID: string; count: number }[];
};

const NGWordsDocument = graphql(`
  query AdminNGWords {
    adminNGWords {
      ID
      pattern
      matchType
      createdAt
    }
  }
`);

const NGWordStatsDocument = graphql(`
  query AdminNGWordStats {
    adminNGWordStats {
      total
      byWord {
        pattern
        count
      }
      byUser {
        userID
        name
        accountID
        count
      }
    }
  }
`);

const CreateNGWordDocument = graphql(`
  mutation AdminCreateNGWord($pattern: String!, $matchType: NGWordMatchType!) {
    adminCreateNGWord(pattern: $pattern, matchType: $matchType) {
      ID
      pattern
      matchType
      createdAt
    }
  }
`);

const DeleteNGWordDocument = graphql(`
  mutation AdminDeleteNGWord($id: ID!) {
    adminDeleteNGWord(id: $id)
  }
`);

export const listNGWords = async (): Promise<NGWord[]> => {
  const data = await requestDoc(NGWordsDocument, {}, getAdminToken());
  return data.adminNGWords;
};

export const getNGWordStats = async (): Promise<NGWordStats> => {
  const data = await requestDoc(NGWordStatsDocument, {}, getAdminToken());
  return data.adminNGWordStats;
};

export const createNGWord = async (pattern: string, matchType: NgWordMatchType): Promise<NGWord> => {
  const data = await requestDoc(CreateNGWordDocument, { pattern, matchType }, getAdminToken());
  return data.adminCreateNGWord;
};

export const deleteNGWord = async (id: string): Promise<boolean> => {
  const data = await requestDoc(DeleteNGWordDocument, { id }, getAdminToken());
  return data.adminDeleteNGWord;
};

// 9桁の数字（レスポンの番号）を登録するときの正規表現。ちょうど9桁の並びだけに当たる。
export const NINE_DIGITS_PATTERN = '(^|\\D)\\d{9}($|\\D)';
