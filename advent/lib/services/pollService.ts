import fs from 'fs';
import { paths } from '../config/paths';
import { FileUtils } from '../utils/fileUtils';
import { logger } from '../utils/logger';
import type { PollData, PollVotes, PollVoteRecord } from '../types';

interface AllPollData {
  [doorNumber: string]: PollData;
}

interface AllPollVotes {
  [doorNumber: string]: PollVoteRecord;
}

export class PollService {
  static initializePolls(): void {
    FileUtils.ensureDirectoryExists(paths.pollsDir);

    if (!fs.existsSync(paths.pollDataPath)) {
      fs.writeFileSync(paths.pollDataPath, JSON.stringify({}), 'utf8');
    }

    if (!fs.existsSync(paths.pollVotesPath)) {
      fs.writeFileSync(paths.pollVotesPath, JSON.stringify({}), 'utf8');
    }
  }

  static getPollData(doorNumber: number): PollData | null {
    try {
      if (!fs.existsSync(paths.pollDataPath)) {
        return null;
      }

      const content = fs.readFileSync(paths.pollDataPath, 'utf8');
      const allPolls: AllPollData = JSON.parse(content);
      return allPolls[doorNumber.toString()] || null;
    } catch (error) {
      logger.error('Error reading poll data:', error);
      return null;
    }
  }

  static savePollData(doorNumber: number, pollData: PollData): void {
    try {
      this.initializePolls();

      const content = fs.existsSync(paths.pollDataPath)
        ? fs.readFileSync(paths.pollDataPath, 'utf8')
        : '{}';
      const allPolls: AllPollData = JSON.parse(content);

      allPolls[doorNumber.toString()] = pollData;
      fs.writeFileSync(paths.pollDataPath, JSON.stringify(allPolls, null, 2));

      // Initialize votes for this poll
      const votesContent = fs.existsSync(paths.pollVotesPath)
        ? fs.readFileSync(paths.pollVotesPath, 'utf8')
        : '{}';
      const allVotes: AllPollVotes = JSON.parse(votesContent);

      if (!allVotes[doorNumber.toString()]) {
        const initialVotes: PollVotes = {};
        pollData.options.forEach((option) => {
          initialVotes[option] = 0;
        });

        allVotes[doorNumber.toString()] = {
          votes: initialVotes,
          voters: {},
        };

        fs.writeFileSync(paths.pollVotesPath, JSON.stringify(allVotes, null, 2));
      }
    } catch (error) {
      logger.error('Error saving poll data:', error);
      throw error;
    }
  }

  static getVotes(doorNumber: number): PollVotes {
    try {
      if (!fs.existsSync(paths.pollVotesPath)) {
        return {};
      }

      const content = fs.readFileSync(paths.pollVotesPath, 'utf8');
      const allVotes: AllPollVotes = JSON.parse(content);
      return allVotes[doorNumber.toString()]?.votes || {};
    } catch (error) {
      logger.error('Error reading votes:', error);
      return {};
    }
  }

  static getUserVote(doorNumber: number, userId: string | null): string | null {
    if (!userId) return null;

    try {
      if (!fs.existsSync(paths.pollVotesPath)) {
        return null;
      }

      const content = fs.readFileSync(paths.pollVotesPath, 'utf8');
      const allVotes: AllPollVotes = JSON.parse(content);
      return allVotes[doorNumber.toString()]?.voters[userId] || null;
    } catch (error) {
      logger.error('Error reading user vote:', error);
      return null;
    }
  }

  static vote(
    doorNumber: number,
    option: string,
    userId: string
  ): { success: boolean; votes: PollVotes; userVote: string } {
    try {
      this.initializePolls();

      const content = fs.readFileSync(paths.pollVotesPath, 'utf8');
      const allVotes: AllPollVotes = JSON.parse(content);

      if (!allVotes[doorNumber.toString()]) {
        throw new Error('Poll not found');
      }

      const pollVotes = allVotes[doorNumber.toString()];

      // Check if user has already voted
      if (pollVotes.voters[userId]) {
        return {
          success: false,
          votes: pollVotes.votes,
          userVote: pollVotes.voters[userId],
        };
      }

      // Record vote
      pollVotes.votes[option] = (pollVotes.votes[option] || 0) + 1;
      pollVotes.voters[userId] = option;

      fs.writeFileSync(paths.pollVotesPath, JSON.stringify(allVotes, null, 2));

      return {
        success: true,
        votes: pollVotes.votes,
        userVote: option,
      };
    } catch (error) {
      logger.error('Error recording vote:', error);
      throw error;
    }
  }

  static getAllPolls(): AllPollData {
    try {
      if (!fs.existsSync(paths.pollDataPath)) {
        return {};
      }
      const content = fs.readFileSync(paths.pollDataPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      logger.error('Error reading all polls:', error);
      return {};
    }
  }

  static deletePoll(doorNumber: number): void {
    try {
      // Delete from pollData
      if (fs.existsSync(paths.pollDataPath)) {
        const content = fs.readFileSync(paths.pollDataPath, 'utf8');
        const allPolls: AllPollData = JSON.parse(content);
        delete allPolls[doorNumber.toString()];
        fs.writeFileSync(paths.pollDataPath, JSON.stringify(allPolls, null, 2));
      }

      // Delete from pollVotes
      if (fs.existsSync(paths.pollVotesPath)) {
        const content = fs.readFileSync(paths.pollVotesPath, 'utf8');
        const allVotes: AllPollVotes = JSON.parse(content);
        delete allVotes[doorNumber.toString()];
        fs.writeFileSync(paths.pollVotesPath, JSON.stringify(allVotes, null, 2));
      }
    } catch (error) {
      logger.error('Error deleting poll:', error);
      throw error;
    }
  }
}
