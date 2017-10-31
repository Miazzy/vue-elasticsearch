import ElasticSearch from 'elasticsearch'

export class ElasticManager {
  constructor () {
    this.client = null
    this.index = ''
    this.type = ''

    this.perPage = 100
  }

  configure ({ host, index, type }) {
    this.client = ElasticSearch.Client({
      host,
      log: 'error',
    })
    this.index = index
    this.type = type
  }

  suggest (query) {
    if (!this.client) {
      return Promise.reject(new Error('Search client is not configured'))
    }

    return this.client
      .suggest({
        index: this.index,
        body: {
          keywordSuggester: {
            prefix: query,
            completion: {
              field: 'text',
            },
          },
        },
      })
      .then(response => (
        response
          .keywordSuggester[0]
          .options
          .map(option => ({
            text: option.text,
            score: option._score,
          }))
        )
      )
  }

  search (keyword, options = {}) {
    if (!this.client) {
      return Promise.reject(new Error('Search client is not configured'))
    }

    const defaultOptions = {
      _source: true,
    }

    return this.client
      .search({
        index: this.index,
        type: this.type,
        body: {
          size: this.perPage,
          query: {
            terms: { keywords: [keyword] },
          },
        },
        ...{ ...defaultOptions, ...options },
      })
      .then(response => {
        return response.hits
      })
  }
}
