import type { InspectionDocument } from '../types/inspection'
import type { InspectionSchema, SectionDefinition, SubsectionDefinition } from '../form_schema/types'
import type { CompanyProfile } from '../services/companyProfile'
import type { PdfTheme, HeaderSlot, FooterSlot } from '../types/pdfTheme'
import { buildPagesFromDocument } from '../services/formPages'
import { h, renderSectionContent } from '../services/pdfReport'
import { findFieldBySource } from '../services/schemaDefaults'

// ── Page dimension helpers ──────────────────────────────────────────────────
// Letter: 612 × 792 pt.  A4: 595 × 842 pt.
const PAGE_DIMS = {
  letter: { w: 612, h: 792 },
  a4:     { w: 595, h: 842 },
}

const HDR_PT = 44  // fixed header height (pt)
const FTR_PT = 36  // fixed footer height (pt)

function printDims(theme: PdfTheme) {
  const size = theme.page.size ?? 'letter'
  const { w, h: ph } = PAGE_DIMS[size] ?? PAGE_DIMS.letter
  const m = theme.page.margins
  const PRINT_W  = w  - m.left - m.right
  const PRINT_H  = ph - m.top  - m.bottom
  const AVAIL_PT = PRINT_H - HDR_PT - FTR_PT
  return { PRINT_W, PRINT_H, AVAIL_PT }
}

// ── CSS ─────────────────────────────────────────────────────────────────────

function buildCss(theme: PdfTheme): string {
  const C = theme.colors
  const F = `-apple-system, system-ui, 'Helvetica Neue', Arial, sans-serif`
  return `
    @page { size: ${theme.page.size ?? 'letter'}; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: ${F}; font-size: 10px; color: ${C.primary}; background: #fff; line-height: 1.45; }

    .pdf-page { display: flex; flex-direction: column; page-break-after: always; overflow: hidden; }
    .pdf-page:last-child { page-break-after: auto; }

    .pdf-header {
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: space-between;
      padding-bottom: 6px; margin-bottom: 10px;
      border-bottom: 0.5pt solid ${C.border};
    }
    .pdf-header-left  { display: flex; align-items: center; gap: 8px; }
    .pdf-header-logo  { max-height: 26px; max-width: 110px; object-fit: contain; display: block; }
    .pdf-header-co    { font-size: 9px; font-weight: 600; color: ${C.primary}; }
    .pdf-header-right { font-size: 8px; color: ${C.secondary}; }

    .pdf-content { flex: 1; min-height: 0; }

    .pdf-footer {
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: space-between;
      padding-top: 5px; margin-top: 8px;
      border-top: 0.5pt solid ${C.border};
      font-size: 7.5px; color: ${C.secondary};
    }

    .cover-logo-block { margin-bottom: 10px; }
    .logo { max-height: 80px; max-width: 200px; object-fit: contain; object-position: left top; display: block; }
    .report-header { padding-bottom: 12px; margin-bottom: 14px; border-bottom: 2px solid ${C.accent}; }
    .schema-title { font-size: 13px; font-weight: 700; color: ${C.primary}; margin-bottom: 3px; }
    .form-meta    { font-size: 9px; color: ${C.secondary}; margin-bottom: 2px; }
    .generated    { font-size: 9px; color: ${C.secondary}; }
    .company-block {
      background: ${C.bg}; border: 1px solid ${C.border}; border-radius: 5px;
      padding: 8px 12px; margin-bottom: 16px; display: flex; gap: 24px; flex-wrap: wrap;
    }
    .company-block div { font-size: 9.5px; color: ${C.secondary}; }
    .company-block strong { color: ${C.primary}; font-weight: 600; }

    .page-section { margin-bottom: 16px; }
    .landscape-section { }
    .section-heading {
      display: flex; align-items: center; gap: 7px;
      border-bottom: 1px solid ${C.border}; padding-bottom: 6px; margin-bottom: 8px;
    }
    .clause-badge {
      font-size: 8px; font-weight: 700; color: ${C.accent};
      background: ${C.accentSoft}; border: 1px solid ${C.accent};
      border-radius: 3px; padding: 1px 5px; white-space: nowrap; flex-shrink: 0;
    }
    .section-title     { font-size: 11px; font-weight: 600; color: ${C.primary}; }
    .section-continued { font-size: 9px; color: ${C.secondary}; font-style: italic; margin-left: 6px; }
    .na-card { background: ${C.naSoft}; border: 1px solid ${C.border}; border-radius: 4px; padding: 8px 12px; font-size: 9.5px; color: ${C.secondary}; font-style: italic; margin-bottom: 10px; }

    .field-table { width: 100%; border-collapse: collapse; border: 1px solid ${C.border}; margin-bottom: 10px; }
    .field-table tr { page-break-inside: avoid; }
    .field-table tr:last-child td { border-bottom: none; }
    .field-label { width: 42%; padding: 5px 8px; border-bottom: 1px solid ${C.border}; border-right: 1px solid ${C.border}; color: ${C.secondary}; font-size: 9px; vertical-align: top; }
    .field-value { width: 58%; padding: 5px 8px; border-bottom: 1px solid ${C.border}; font-size: 10px; vertical-align: top; word-break: break-word; }
    .group-header { padding: 5px 8px; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: ${C.secondary}; background: ${C.bg}; border-bottom: 1px solid ${C.border}; }
    .field-notes { margin-top: 3px; }

    .data-table { width: 100%; border-collapse: collapse; border: 1px solid ${C.border}; margin-bottom: 10px; font-size: 9px; }
    .data-table thead { display: table-header-group; }
    .data-table tr { page-break-inside: avoid; }
    .data-table th { background: ${C.bg}; border: 1px solid ${C.border}; padding: 4px 6px; font-weight: 600; text-align: left; color: ${C.secondary}; }
    .data-table td { border: 1px solid ${C.border}; padding: 4px 6px; vertical-align: top; word-break: break-word; }
    .data-table tr:nth-child(even) td { background: #fafaf8; }

    .badge { display: inline-block; font-size: 8.5px; font-weight: 700; border-radius: 3px; padding: 1px 6px; border: 1px solid; white-space: nowrap; }
    .badge.pass { background: ${C.passSoft}; color: ${C.pass}; border-color: ${C.pass}; }
    .badge.fail { background: ${C.failSoft}; color: ${C.fail}; border-color: ${C.fail}; }
    .badge.na   { background: ${C.naSoft};   color: ${C.na};   border-color: ${C.border}; }
    .empty { color: ${C.secondary}; font-style: italic; }
    .center { text-align: center; }
    .note-text { font-size: 8.5px; color: ${C.secondary}; font-style: italic; margin-bottom: 5px; }
    .note-group-label { font-size: 8px; font-weight: 700; text-transform: uppercase; color: ${C.secondary}; margin-top: 6px; }
    .note-link { color: ${C.accent}; text-decoration: underline; font-style: normal; }
    .signature-img { max-width: 200px; max-height: 80px; border: 1px solid ${C.border}; border-radius: 3px; }
    .field-image { max-width: 200px; max-height: 120px; border: 1px solid ${C.border}; border-radius: 3px; }
  `
}

// ── Slot renderers ───────────────────────────────────────────────────────────

function renderHeaderSlot(
  slot: HeaderSlot,
  doc: InspectionDocument,
  schema: InspectionSchema,
  profile: CompanyProfile,
  logoDataUri: string | null,
  today: string,
): string {
  switch (slot) {
    case 'logo':
      return logoDataUri
        ? `<img class="pdf-header-logo" src="${logoDataUri}" alt="" />`
        : ''
    case 'company_name':
      return `<span class="pdf-header-co">${h(profile.name || schema.formId)}</span>`
    case 'form_id':
      return `<span class="pdf-header-right">${h(schema.formId)}</span>`
    case 'schema_title':
      return `<span>${h(schema.title)}</span>`
    case 'doc_filename':
      return `<span>${h(doc.filename)}</span>`
    case 'today':
      return `<span>${today}</span>`
  }
}

function renderHeaderBand(
  slots: HeaderSlot[],
  doc: InspectionDocument,
  schema: InspectionSchema,
  profile: CompanyProfile,
  logoDataUri: string | null,
  today: string,
): string {
  return slots
    .map(s => renderHeaderSlot(s, doc, schema, profile, logoDataUri, today))
    .filter(Boolean)
    .join('')
}

function renderFooterSlot(slot: FooterSlot, doc: InspectionDocument, schema: InspectionSchema, profile: CompanyProfile, today: string): string {
  switch (slot) {
    case 'form_id':      return h(schema.formId)
    case 'doc_filename': return h(doc.filename)
    case 'company_name': return h(profile.name)
    case 'today':        return today
    case 'page_of_total': return 'PAGE_NUM / TOTAL_PAGES'
  }
}

function buildFooterTmpl(
  slots: { left: FooterSlot[]; right: FooterSlot[] },
  doc: InspectionDocument,
  schema: InspectionSchema,
  profile: CompanyProfile,
  today: string,
): string {
  const left  = slots.left.map(s => renderFooterSlot(s, doc, schema, profile, today)).filter(Boolean).join(' · ')
  const right = slots.right.map(s => renderFooterSlot(s, doc, schema, profile, today)).filter(Boolean).join(' · ')
  return `<span>${left}</span><span>${right}</span>`
}

// ── Main generate function ───────────────────────────────────────────────────

export function generate(
  doc: InspectionDocument,
  schema: InspectionSchema,
  profile: CompanyProfile,
  theme: PdfTheme,
): string {
  const pages = buildPagesFromDocument(schema, doc.repeatableGroups, doc.applicableStates)
  const today = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })

  // Resolve logo from fieldValues via the source field, fall back to profile
  const logoRef = findFieldBySource(schema, 'company_profile.logoUri')
  const logoDataUri = logoRef
    ? (doc.fieldValues[`${logoRef.groupKey}/${logoRef.fieldId}`] ?? profile.logoUri ?? null)
    : (profile.logoUri ?? null)
  const showLogo = theme.cover.show_logo !== false

  // ── Cover ────────────────────────────────────────────────────────────────
  const logoHtml = showLogo && logoDataUri
    ? `<div class="cover-logo-block"><img class="logo" src="${logoDataUri}" alt="Company Logo" /></div>`
    : ''

  const companyAddr = [profile.address1, profile.address2, profile.city, profile.province, profile.postalCode]
    .filter(Boolean).join(', ')

  const coverHtml = `
    <div class="report-header">
      ${logoHtml}
      ${theme.cover.show_title !== false ? `<div class="schema-title">${h(schema.title)}</div>` : ''}
      ${theme.cover.show_form_meta !== false ? `<div class="form-meta">Form ${h(schema.formId)} · Version ${h(schema.version)}</div>` : ''}
      ${theme.cover.show_generated_date !== false ? `<div class="generated">Generated: ${today} · Inspection: ${h(doc.filename)}</div>` : ''}
    </div>
    ${theme.cover.show_company_block !== false ? `
    <div class="company-block">
      <div><strong>${h(profile.name || 'Service Company')}</strong></div>
      ${profile.phone ? `<div>Phone: ${h(profile.phone)}</div>` : ''}
      ${companyAddr ? `<div>Address: ${h(companyAddr)}</div>` : ''}
    </div>` : ''}`

  // ── Sections ─────────────────────────────────────────────────────────────
  const sectionsHtml = pages.map((page) => {
    const section = schema.sections.find((s) => s.id === page.sectionId)!
    const target: SectionDefinition | SubsectionDefinition = page.subsectionId
      ? section.subsections!.find((s) => s.id === page.subsectionId)!
      : section
    const isLandscape =
      target.type === 'device_legend' ||
      target.type === 'device_record_list' ||
      (target.type === 'repeatable_list' && (target.item_fields?.length ?? 0) > 5)
    const divClass = isLandscape ? 'page-section landscape-section' : 'page-section'
    const clauseHtml = page.clause ? `<span class="clause-badge">§${page.clause}</span>` : ''
    const heading = `<div class="section-heading">${clauseHtml}<span class="section-title">${page.title}</span></div>`
    const body = page.isApplicable
      ? renderSectionContent(page, target, section, doc, schema, pages)
      : `<div class="na-card">— Not Applicable —</div>`
    return `<div class="${divClass}" data-clause="${h(page.clause ?? '')}" data-title="${h(page.title)}" data-landscape="${isLandscape}">${heading}${body}</div>`
  }).join('\n')

  // ── Header / footer templates ────────────────────────────────────────────
  const leftHtml  = renderHeaderBand(theme.header.left,  doc, schema, profile, showLogo ? logoDataUri : null, today)
  const rightHtml = renderHeaderBand(theme.header.right, doc, schema, profile, showLogo ? logoDataUri : null, today)
  const headerHtml = `<div class="pdf-header-left">${leftHtml}</div><div>${rightHtml}</div>`
  const footerTmpl = buildFooterTmpl(theme.footer, doc, schema, profile, today)

  // ── Page dimensions from theme ───────────────────────────────────────────
  const { PRINT_W, PRINT_H, AVAIL_PT } = printDims(theme)

  // ── Pagination script ────────────────────────────────────────────────────
  const script = `
<script>
(function () {
  window.addEventListener('load', function () {
    var PRINT_W  = ${PRINT_W};
    var PRINT_H  = ${PRINT_H};
    var HDR_PT   = ${HDR_PT};
    var FTR_PT   = ${FTR_PT};
    var AVAIL_PT = ${AVAIL_PT};

    var bodyW = document.body.getBoundingClientRect().width || PRINT_W;
    var scale = PRINT_W / bodyW;
    var pageHpx  = PRINT_H / scale;
    var hdrHpx   = HDR_PT  / scale;
    var ftrHpx   = FTR_PT  / scale;
    var availHpx = AVAIL_PT / scale;

    var HEADER_HTML = ${JSON.stringify(headerHtml)};
    var FOOTER_TMPL = ${JSON.stringify(footerTmpl)};

    function makeHeader() {
      var d = document.createElement('div');
      d.className = 'pdf-header';
      d.innerHTML = HEADER_HTML;
      return d;
    }
    function makeFooter(n, total) {
      var d = document.createElement('div');
      d.className = 'pdf-footer';
      d.innerHTML = FOOTER_TMPL.replace('PAGE_NUM', n).replace('TOTAL_PAGES', total);
      return d;
    }
    function makePage(pageNum, total, includeHeader, heightPx) {
      var p = document.createElement('div');
      p.className = 'pdf-page';
      p.style.height = heightPx + 'px';
      if (includeHeader) p.appendChild(makeHeader());
      var c = document.createElement('div');
      c.className = 'pdf-content';
      p.appendChild(c);
      p.appendChild(makeFooter(pageNum, total));
      return { page: p, content: c };
    }

    function buf(px) { return px + 4; }

    var items = [];

    var coverEl = document.querySelector('.cover-content');
    if (coverEl) {
      items.push({ kind: 'cover', el: coverEl, height: buf(coverEl.getBoundingClientRect().height) });
    }

    var sections = Array.prototype.slice.call(document.querySelectorAll('.page-section'));
    sections.forEach(function (sec) {
      var isLandscape = sec.dataset.landscape === 'true';
      if (isLandscape) {
        var dataRows = sec.querySelectorAll('tbody tr');
        if (dataRows.length === 0) isLandscape = false;
      }

      var clauseTxt = sec.dataset.clause || '';
      var titleTxt  = sec.dataset.title  || '';
      var headingEl = sec.querySelector('.section-heading');
      var headingH  = headingEl ? buf(headingEl.getBoundingClientRect().height) : 0;

      if (isLandscape) {
        items.push({ kind: 'landscape', el: sec, clauseTxt: clauseTxt, titleTxt: titleTxt,
                     height: buf(sec.getBoundingClientRect().height) });
        return;
      }

      items.push({ kind: 'heading', clauseTxt: clauseTxt, titleTxt: titleTxt,
                   isContinued: false, height: headingH });

      var children = Array.prototype.slice.call(sec.children).filter(function (c) {
        return !c.classList.contains('section-heading');
      });
      var fieldTable = sec.querySelector('table.field-table');
      var dataTable  = sec.querySelector('table.data-table');

      if (fieldTable) {
        var rows = Array.prototype.slice.call(fieldTable.querySelectorAll('tr'));
        var i = 0;
        while (i < rows.length) {
          var row = rows[i];
          var isGroupHdr = !!row.querySelector('.group-header');
          if (isGroupHdr) {
            var groupRows = [row];
            var groupH = buf(row.getBoundingClientRect().height);
            i++;
            while (i < rows.length && !rows[i].querySelector('.group-header')) {
              groupRows.push(rows[i]);
              groupH += buf(rows[i].getBoundingClientRect().height);
              i++;
            }
            items.push({ kind: 'table-rows', rows: groupRows,
                         tableClass: fieldTable.className, tableTag: 'table',
                         clauseTxt: clauseTxt, titleTxt: titleTxt, height: groupH });
          } else {
            items.push({ kind: 'table-rows', rows: [row],
                         tableClass: fieldTable.className, tableTag: 'table',
                         clauseTxt: clauseTxt, titleTxt: titleTxt,
                         height: buf(row.getBoundingClientRect().height) });
            i++;
          }
        }
      } else if (dataTable) {
        var thead = dataTable.querySelector('thead');
        var theadH = thead ? buf(thead.getBoundingClientRect().height) : 0;
        if (thead) {
          items.push({ kind: 'table-thead', el: thead, tableClass: dataTable.className,
                       clauseTxt: clauseTxt, titleTxt: titleTxt, height: theadH });
        }
        Array.prototype.slice.call(dataTable.querySelectorAll('tbody tr')).forEach(function (row) {
          items.push({ kind: 'table-rows', rows: [row], tableClass: dataTable.className,
                       tableTag: 'table', clauseTxt: clauseTxt, titleTxt: titleTxt,
                       height: buf(row.getBoundingClientRect().height) });
        });
      } else {
        children.forEach(function (child) {
          items.push({ kind: 'block', el: child, clauseTxt: clauseTxt, titleTxt: titleTxt,
                       height: buf(child.getBoundingClientRect().height) });
        });
      }
    });

    var pageBins = [];
    var currentBin = [];
    var currentH   = 0;
    var isFirstPage = true;

    function pageAvail() { return isFirstPage ? (pageHpx - ftrHpx) : availHpx; }

    function flushPage() {
      pageBins.push({ items: currentBin, isFirstPage: isFirstPage });
      currentBin = []; currentH = 0; isFirstPage = false;
    }

    function addItem(item) { currentBin.push(item); currentH += item.height; }

    items.forEach(function (item) {
      if (item.kind === 'landscape') {
        if (currentH > 0) flushPage();
        pageBins.push({ items: [item], isFirstPage: false, isLandscape: true });
        currentBin = []; currentH = 0;
        return;
      }

      var avail = pageAvail();

      if (currentH + item.height > avail && currentH > 0) {
        var prevKey = currentBin.length > 0
          ? ((currentBin[currentBin.length - 1].clauseTxt || '') +
             (currentBin[currentBin.length - 1].titleTxt  || ''))
          : '';
        flushPage();
        var newKey = (item.clauseTxt || '') + (item.titleTxt || '');
        if (newKey && newKey === prevKey && item.kind !== 'heading') {
          addItem({ kind: 'heading', clauseTxt: item.clauseTxt, titleTxt: item.titleTxt,
                    isContinued: true, height: 32 / scale });
        }
      }
      addItem(item);
    });

    if (currentBin.length > 0) flushPage();

    for (var bi = 0; bi < pageBins.length - 1; bi++) {
      var bin = pageBins[bi];
      if (bin.items.length > 0 && bin.items[bin.items.length - 1].kind === 'heading') {
        var orphan = bin.items.pop();
        orphan.isContinued = false;
        var nextBin = pageBins[bi + 1];
        var firstOfNext = nextBin.items[0];
        if (firstOfNext && firstOfNext.kind === 'heading' &&
            firstOfNext.clauseTxt === orphan.clauseTxt &&
            firstOfNext.titleTxt  === orphan.titleTxt) {
          nextBin.items[0] = orphan;
        } else {
          nextBin.items.unshift(orphan);
        }
      }
    }
    pageBins = pageBins.filter(function (b) { return b.items.length > 0; });

    var totalPages = pageBins.length;

    function renderHeading(item) {
      var d = document.createElement('div');
      d.className = 'section-heading';
      if (item.clauseTxt) {
        var cb = document.createElement('span');
        cb.className = 'clause-badge';
        cb.textContent = '§' + item.clauseTxt;
        d.appendChild(cb);
      }
      var st = document.createElement('span');
      st.className = 'section-title';
      st.textContent = item.titleTxt;
      d.appendChild(st);
      if (item.isContinued) {
        var cont = document.createElement('span');
        cont.className = 'section-continued';
        cont.textContent = '(continued)';
        d.appendChild(cont);
      }
      return d;
    }

    function renderItems(items, contentEl) {
      var openTable = null;
      var openTableClass = '';
      var openThead = null;

      function closeTable() {
        if (openTable) { contentEl.appendChild(openTable); openTable = null; openTableClass = ''; openThead = null; }
      }

      items.forEach(function (item) {
        if (item.kind === 'cover') {
          closeTable(); contentEl.appendChild(item.el.cloneNode(true));
        } else if (item.kind === 'heading') {
          closeTable(); contentEl.appendChild(renderHeading(item));
        } else if (item.kind === 'block') {
          closeTable(); contentEl.appendChild(item.el.cloneNode(true));
        } else if (item.kind === 'table-thead') {
          closeTable();
          openTable = document.createElement(item.tableTag || 'table');
          openTable.className = item.tableClass || '';
          openThead = item.el.cloneNode(true);
          openTable.appendChild(openThead);
          openTableClass = item.tableClass || '';
        } else if (item.kind === 'table-rows') {
          if (!openTable || openTableClass !== item.tableClass) {
            closeTable();
            openTable = document.createElement(item.tableTag || 'table');
            openTable.className = item.tableClass || '';
            openTableClass = item.tableClass || '';
          }
          item.rows.forEach(function (row) { openTable.appendChild(row.cloneNode(true)); });
        } else if (item.kind === 'landscape') {
          closeTable(); contentEl.appendChild(item.el.cloneNode(true));
        }
      });
      closeTable();
    }

    document.body.innerHTML = '';
    pageBins.forEach(function (bin, i) {
      var pn = i + 1;
      var obj = makePage(pn, totalPages, !bin.isFirstPage, pageHpx);
      renderItems(bin.items, obj.content);
      document.body.appendChild(obj.page);
    });
  });
}());
</script>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${h(doc.filename)} — Inspection Report</title>
  <style>${buildCss(theme)}</style>
</head>
<body>
  <div class="cover-content">${coverHtml}</div>
  ${sectionsHtml}
  ${script}
</body>
</html>`
}
