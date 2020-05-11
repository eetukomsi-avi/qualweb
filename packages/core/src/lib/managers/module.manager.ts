'use strict';

import { Page } from 'puppeteer';
import { randomBytes } from 'crypto';
import { Url, QualwebOptions, ProcessedHtml, SourceHtml, CSSStylesheet } from '@qualweb/core';
import { CSSTechniques } from '@qualweb/css-techniques';

import Evaluation from '../data/evaluation.object';

function parseUrl(url: string, pageUrl: string): Url {
  let inputUrl = url;
  let protocol: string;
  let domainName: string;
  let domain: string;
  let uri: string;
  let completeUrl = pageUrl;

  protocol = completeUrl.split('://')[0];
  domainName = completeUrl.split('/')[2];

  const tmp = domainName.split('.');
  domain = tmp[tmp.length - 1];
  uri = completeUrl.split('.' + domain)[1];

  const parsedUrl = {
    inputUrl,
    protocol,
    domainName,
    domain,
    uri,
    completeUrl
  };

  return parsedUrl;
}

async function evaluateUrl(url: string, sourceHtml: SourceHtml, page: Page, stylesheets: CSSStylesheet[], mappedDOM: any, execute: any, options: QualwebOptions): Promise<Evaluation> {

  const [pageUrl, plainHtml, pageTitle, elements, browserUserAgent] = await Promise.all([
    page.url(),
    page.evaluate(() => {
      return document.documentElement.outerHTML;
    }),
    page.title(),
    page.$$('*'),
    page.browser().userAgent()
  ]);

  const processedHtml: ProcessedHtml = {
    html: {
      plain: plainHtml
    },
    title: pageTitle,
    elementCount: elements.length
  };

  const viewport = page.viewport();

  const evaluator = {
    name: 'QualWeb',
    description: 'QualWeb is an automatic accessibility evaluator for webpages.',
    version: '3.0.0',
    homepage: 'http://www.qualweb.di.fc.ul.pt/',
    date: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
    hash: randomBytes(40).toString('hex'),
    url: parseUrl(url, pageUrl),
    page: {
      viewport: {
        mobile: viewport.isMobile,
        landscape: viewport.isLandscape,
        userAgent: browserUserAgent,
        resolution: {
          width: viewport.width,
          height: viewport.height
        }
      },
      dom: {
        source: sourceHtml,
        processed: processedHtml,
        stylesheets
      }
    }
  };

  const evaluation = new Evaluation(evaluator);

  const reports = new Array<any>();
  const css = new CSSTechniques();
  await page.addScriptTag({
    path: require.resolve('./qwPage.js')
  })

  if (execute.act) {
    await page.addScriptTag({
      path: require.resolve('./act.js')
    })
    sourceHtml.html.parsed = [];
    const actReport = await page.evaluate((sourceHtml, stylesheets, options) => {
      // @ts-ignore 
      const act = new ACTRules.ACTRules();
      if (options)
        act.configure(options);
        // @ts-ignore 
      const report = act.execute(sourceHtml, new QWPage.QWPage(document), stylesheets);
      return report;
    }, sourceHtml, stylesheets, options['act-rules']);

    reports.push(actReport);
  }

  if (execute.html) {
    await page.addScriptTag({
      path: require.resolve('./html.js')
    })
    const htmlReport = await page.evaluate((options) => {
      // @ts-ignore 
      const html = new HTMLTechniques.HTMLTechniques();
      html.configure(options)
      // @ts-ignore 
      const report = html.execute(new QWPage.QWPage(document), false, {});
      return report;
    }, options['html-techniques']);
    reports.push(htmlReport);
  }

  if (execute.css) {
    if (options['css-techniques']) {
      css.configure(options['css-techniques']);
    }
    reports.push(css.execute(stylesheets, mappedDOM));
  }

  if (execute.bp) {
    await page.addScriptTag({
      path: require.resolve('./bp.js')
    })
    const bpReport = await page.evaluate((options) => {
      // @ts-ignore 
      const bp = new BestPractices.BestPractices();
      bp.configure(options)
      // @ts-ignore 
      const report = bp.execute(new QWPage.QWPage(document));
      return report;
    }, options['best-practices']);
    reports.push(bpReport);
  }


  for (const report of reports || []) {
    if (report.type === 'wappalyzer') {
      evaluation.addModuleEvaluation('wappalyzer', report);
    } else if (report.type === 'act-rules') {
      evaluation.addModuleEvaluation('act-rules', report);
    } else if (report.type === 'html-techniques') {
      evaluation.addModuleEvaluation('html-techniques', report);
    } else if (report.type === 'css-techniques') {
      css.resetConfiguration();
      evaluation.addModuleEvaluation('css-techniques', report);
    } else if (report.type === 'best-practices') {
      evaluation.addModuleEvaluation('best-practices', report);
    }
  }

  return evaluation;
}

async function evaluateHtml(sourceHtml: SourceHtml, page: Page, stylesheets: CSSStylesheet[], mappedDOM: any, execute: any, options: QualwebOptions): Promise<Evaluation> {

  const [plainHtml, pageTitle, elements, browserUserAgent] = await Promise.all([
    page.evaluate(() => {
      return document.documentElement.outerHTML;
    }),
    page.title(),
    page.$$('*'),
    page.browser().userAgent()
  ]);

  const processedHtml: ProcessedHtml = {
    html: {
      plain: plainHtml
    },
    title: pageTitle,
    elementCount: elements.length
  };

  const viewport = page.viewport();

  const evaluator = {
    name: 'QualWeb',
    description: 'QualWeb is an automatic accessibility evaluator for webpages.',
    version: '3.0.0',
    homepage: 'http://www.qualweb.di.fc.ul.pt/',
    date: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
    hash: randomBytes(40).toString('hex'),
    page: {
      viewport: {
        mobile: viewport.isMobile,
        landscape: viewport.isLandscape,
        userAgent: browserUserAgent,
        resolution: {
          width: viewport.width,
          height: viewport.height
        }
      },
      dom: {
        source: sourceHtml,
        processed: processedHtml,
        stylesheets
      }
    }
  };

  const evaluation = new Evaluation(evaluator);
  const reports = new Array<any>();
  const css = new CSSTechniques();

  if (execute.act) {
    await page.addScriptTag({
      path: require.resolve('./act.js')
    })
    sourceHtml.html.parsed = [];
    const actReport = await page.evaluate((sourceHtml, stylesheets, options) => {
      // @ts-ignore 
      const act = new ACTRules.ACTRules();
      if (options)
        act.configure(options);
        // @ts-ignore 
      const report = act.execute(sourceHtml, new QWPage.QWPage(document), stylesheets);
      return report;
    }, sourceHtml, stylesheets, options['act-rules']);

    reports.push(actReport);
  }

  if (execute.html) {
    await page.addScriptTag({
      path: require.resolve('./html.js')
    })
    const htmlReport = await page.evaluate((options) => {
      // @ts-ignore 
      const html = new HTMLTechniques.HTMLTechniques();
      html.configure(options)
      // @ts-ignore 
      const report = html.execute(new QWPage.QWPage(document), false, {});
      return report;
    }, options['html-techniques']);
    reports.push(htmlReport);
  }

  if (execute.css) {
    if (options['css-techniques']) {
      css.configure(options['css-techniques']);
    }
    reports.push(css.execute(stylesheets, mappedDOM));
  }

  if (execute.bp) {
    await page.addScriptTag({
      path: require.resolve('./bp.js')
    })
    const bpReport = await page.evaluate((options) => {
      // @ts-ignore 
      const bp = new BestPractices.BestPractices();
      bp.configure(options);
      // @ts-ignore 
      const report = bp.execute(new QWPage.QWPage(document));
      return report;
    }, options['best-practices']);
    reports.push(bpReport);
  }


  for (const report of reports || []) {
    if (report.type === 'wappalyzer') {
      evaluation.addModuleEvaluation('wappalyzer', report);
    } else if (report.type === 'act-rules') {
      evaluation.addModuleEvaluation('act-rules', report);
    } else if (report.type === 'html-techniques') {
      evaluation.addModuleEvaluation('html-techniques', report);
    } else if (report.type === 'css-techniques') {
      css.resetConfiguration();
      evaluation.addModuleEvaluation('css-techniques', report);
    } else if (report.type === 'best-practices') {
      evaluation.addModuleEvaluation('best-practices', report);
    }
  }

  return evaluation;
}

export {
  evaluateUrl,
  evaluateHtml
};