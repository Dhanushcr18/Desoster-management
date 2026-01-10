import axios from 'axios';

class NewsService {
  private apiKey: string;
  private baseUrl = 'https://newsapi.org/v2';

  constructor() {
    this.apiKey = 'a208dff81ab6490fb2eeea80e9a6ea5f';
  }

  async getDisasterNews(location: string): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/everything`, {
        params: {
          q: `${location} AND (disaster OR emergency OR flood OR earthquake OR storm OR fire OR accident)`,
          sortBy: 'publishedAt',
          apiKey: this.apiKey,
          language: 'en',
          pageSize: 3
        }
      });

      if (response.data.status === 'ok' && response.data.articles.length > 0) {
        return response.data.articles.map((article: any) => 
          `• [${new Date(article.publishedAt).toLocaleDateString()}] ${article.title} - ${article.source.name}`
        );
      }
      return [];
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  }
}

export const newsService = new NewsService();
