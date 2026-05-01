import pricingData from '@/constants/pricing.json';

function price(key, source = 'hd') {
  const row = pricingData.find((r) => r.material_key === key);
  if (!row) return 0;
  return row[`${source}_price`] ?? row.hd_price ?? 0;
}

function boardsFromPieces(pieces, stock_in, material_key, display_name, source) {
  const needed = pieces.map((p) => p.w_in).filter((l) => l > 0);
  if (!needed.length) return [];
  const qty = Math.ceil(needed.reduce((a, b) => a + b, 0) / stock_in) + 1;
  const unit_price = price(material_key, source);
  return [
    {
      name: display_name,
      qty,
      length_in: stock_in,
      unit_price,
      source,
      total: +(qty * unit_price).toFixed(2),
      material_key,
    },
  ];
}

export function piecesToMaterials(pattern, pieces, wallDims, source = 'hd') {
  const t = pattern.type;
  const area_sqft = (wallDims.width_in * wallDims.height_in) / 144;

  switch (t) {
    case 'chevron':
    case 'zigzag':
    case 'asym-zig':
      return [
        ...boardsFromPieces(pieces, 96, '1x4-pine-8ft', '1x4 Select Pine 8ft', source),
        { name: 'Construction Adhesive 10oz', qty: Math.ceil(area_sqft / 30), length_in: null, unit_price: price('adhesive-10oz', source), source, total: 0, material_key: 'adhesive-10oz' },
      ].map(normalizeTotal);

    case 'shiplap':
    case 'industrial':
      return [
        ...boardsFromPieces(pieces, 144, '1x8-shiplap-12ft', '1x8 Shiplap Pine 12ft', source),
        { name: 'Paint 1gal Interior', qty: Math.ceil(area_sqft / 400), length_in: null, unit_price: price('paint-1gal', source), source, total: 0, material_key: 'paint-1gal' },
      ].map(normalizeTotal);

    case 'board-batten':
    case 'wainscot':
      return [
        ...boardsFromPieces(
          pieces.filter((p) => p.layer === 'boards' || p.layer === 'rail'),
          96, '1x8-pine-8ft', '1x8 Pine 8ft', source
        ),
        ...boardsFromPieces(
          pieces.filter((p) => p.layer === 'battens'),
          96, '1x4-pine-8ft', '1x4 Pine 8ft (battens)', source
        ),
      ].map(normalizeTotal);

    case 'vertical-slat':
    case 'fluted':
      return boardsFromPieces(pieces, 96, '1x2-furring-8ft', '1x2 Furring 8ft', source).map(normalizeTotal);

    case 'herringbone':
      return boardsFromPieces(pieces, 96, '1x3-poplar-8ft', '1x3 Poplar 8ft', source).map(normalizeTotal);

    case 'hexagon':
    case 'arched-niche':
      return [
        { name: '1/4 MDF Sheet 4x8', qty: Math.ceil(area_sqft / 32), length_in: 96, unit_price: price('mdf-quarter-4x8', source), source, total: 0, material_key: 'mdf-quarter-4x8' },
        ...boardsFromPieces(pieces.slice(0, 20), 96, '1x2-furring-8ft', '1x2 Furring 8ft', source),
      ].map(normalizeTotal);

    case 'faux-beam':
      return boardsFromPieces(pieces, 96, '1x6-pine-8ft', '1x6 Pine 8ft', source).map(normalizeTotal);

    case 'diamond':
      return boardsFromPieces(pieces, 96, '1x3-poplar-8ft', '1x3 Poplar 8ft', source).map(normalizeTotal);

    case 'wave':
    case 'diagonal':
      return boardsFromPieces(pieces, 96, '1x4-pine-8ft', '1x4 Trim 8ft', source).map(normalizeTotal);

    case 'ledge-shelf':
      return boardsFromPieces(pieces, 96, '1x12-pine-8ft', '1x12 Pine 8ft', source).map(normalizeTotal);

    case 'brick':
      return [
        { name: '1/2 MDF Sheet 4x8', qty: Math.ceil(area_sqft / 32), length_in: 96, unit_price: price('mdf-half-4x8', source), source, total: 0, material_key: 'mdf-half-4x8' },
      ].map(normalizeTotal);

    default:
      return boardsFromPieces(pieces, 96, '1x4-pine-8ft', '1x4 Pine 8ft', source).map(normalizeTotal);
  }
}

function normalizeTotal(line) {
  if (!line.unit_price) return line;
  return { ...line, total: +(line.qty * line.unit_price).toFixed(2) };
}
