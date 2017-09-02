const level = require('levelup')
const down = require('leveldown')
const SearchIndexAdder = require('search-index-adder')
const SearchIndexSearcher = require('search-index-searcher')

module.exports = function (givenOptions, moduleReady) {
  const optionsLoaded = function (err, SearchIndex) {
    const siUtil = require('./siUtil.js')(SearchIndex.options)
    if (err) return moduleReady(err)
    SearchIndex.close = siUtil.close
    SearchIndex.countDocs = siUtil.countDocs
    getAdder(SearchIndex, adderLoaded)
  }

  const adderLoaded = function (err, SearchIndex) {
    if (err) return moduleReady(err)
    getSearcher(SearchIndex, searcherLoaded)
  }

  const searcherLoaded = function (err, SearchIndex) {
    if (err) return moduleReady(err)
    return moduleReady(err, SearchIndex)
  }

  getOptions(givenOptions, optionsLoaded)
}

const getAdder = function (SearchIndex, done) {
  SearchIndexAdder(SearchIndex.options, function (err, searchIndexAdder) {
    SearchIndex.add = searchIndexAdder.add
    SearchIndex.callbackyAdd = searchIndexAdder.concurrentAdd  // deprecated
    SearchIndex.concurrentAdd = searchIndexAdder.concurrentAdd
    SearchIndex.concurrentDel = searchIndexAdder.concurrentDel
    SearchIndex.createWriteStream = searchIndexAdder.createWriteStream
    SearchIndex.dbWriteStream = searchIndexAdder.dbWriteStream
    SearchIndex.defaultPipeline = searchIndexAdder.defaultPipeline
    SearchIndex.del = searchIndexAdder.deleter
    SearchIndex.deleteStream = searchIndexAdder.deleteStream
    SearchIndex.feed = searchIndexAdder.feed
    SearchIndex.flush = searchIndexAdder.flush
    done(err, SearchIndex)
  })
}

const getSearcher = function (SearchIndex, done) {
  SearchIndexSearcher(SearchIndex.options, function (err, searchIndexSearcher) {
    SearchIndex.availableFields = searchIndexSearcher.availableFields
    SearchIndex.buckets = searchIndexSearcher.bucketStream
    SearchIndex.categorize = searchIndexSearcher.categoryStream
    SearchIndex.classify = searchIndexSearcher.classify
    SearchIndex.dbReadStream = searchIndexSearcher.dbReadStream
    SearchIndex.get = searchIndexSearcher.get
    SearchIndex.match = searchIndexSearcher.match
    SearchIndex.scan = searchIndexSearcher.scan
    SearchIndex.search = searchIndexSearcher.search
    SearchIndex.totalHits = searchIndexSearcher.totalHits
    done(err, SearchIndex)
  })
}

const getOptions = function (options, done) {
  var SearchIndex = {}
  SearchIndex.options = Object.assign({}, {
    indexPath: 'si',
    keySeparator: '￮',
    logLevel: 'error',
    log: {
      debug: options.logLevel === 'debug' ? console.log : function() {},
      info: console.info,
      warn: console.warn,
      error: console.error
    }
  }, options)
  if (!options.indexes) {
    level(SearchIndex.options.indexPath || 'si', {
      valueEncoding: 'json',
      db: down
    }, function (err, db) {
      SearchIndex.options.indexes = db
      return done(err, SearchIndex)
    })
  } else {
    return done(null, SearchIndex)
  }
}
