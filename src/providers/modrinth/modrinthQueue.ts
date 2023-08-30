import axios, { AxiosInstance, AxiosResponse } from 'axios';
import PQueue from 'p-queue';

const API_BASE_URL = 'https://api.modrinth.com/v2';
const CONCURRENCY = 5;

class ModrinthQueue {
  private queue: PQueue;
  private remainingRequests: number;
  private resetTime: number;
  private api: AxiosInstance;

  constructor(userAgent: string) {
    this.queue = new PQueue({ concurrency: CONCURRENCY }); // Adjust concurrency as needed
    this.remainingRequests = 300; // Initial value, will be updated by response headers
    this.resetTime = 0; // Initial value, will be updated by response headers

    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'User-Agent': userAgent,
      },
    });
  }

  private async updateRateLimits(response: AxiosResponse) {
    this.remainingRequests = Number(response.headers['x-ratelimit-remaining']);
    this.resetTime = Number(response.headers['x-ratelimit-reset']);
  }

  async get<T>(url: string) {
    const task = async () => {
      if (this.remainingRequests <= CONCURRENCY) {
        const waitTime = this.resetTime + 10;
        await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
      }

      const response = await this.api.get<T>(API_BASE_URL + url);
      this.updateRateLimits(response);
      return response;
    };

    const result = await this.queue.add(task);
    return result as AxiosResponse<T, any>;
  }
}

export default ModrinthQueue;
