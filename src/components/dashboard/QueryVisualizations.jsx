const colors = [
  "#3694f5",
  "#8965eb",
  "#22bb8c",
  "#ffad43",
  "#ed6688",
  "#18b9c9",
  "#f27452",
];
const priceBands = ["Low", "Mid", "High"];
const numberFormatter = new Intl.NumberFormat("en-US");
const decimalFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
}

function formatNumber(value) {
  return decimalFormatter.format(numeric(value));
}

function categoryName(product) {
  const category = product.category;
  return typeof category === "string"
    ? category
    : category?.name || "Uncategorized";
}

function ChartPanel({ title, type, children }) {
  return (
    <article className="visualization-card">
      <header className="visualization-card-header">
        <span className="visualization-type">{type}</span>
        <h3>{title}</h3>
      </header>
      {children}
    </article>
  );
}

function ChartSvg({ label, children, className = "" }) {
  return (
    <svg
      className={`chart-svg ${className}`}
      viewBox="0 0 300 160"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      {children}
    </svg>
  );
}

function EmptyChart() {
  return <p className="visualization-empty">No data available.</p>;
}

function getCategoryCounts(products) {
  return products.reduce((counts, product) => {
    const name = categoryName(product);
    counts[name] = (counts[name] || 0) + 1;
    return counts;
  }, {});
}

function getProductStats(products) {
  const categories = {};

  products.forEach((product) => {
    const name = categoryName(product);
    const price = numeric(product.price);
    const quantity = numeric(product.quantity);

    if (!categories[name]) {
      categories[name] = {
        name,
        count: 0,
        min: price,
        max: price,
        prices: [],
        statuses: {},
        bands: { Low: 0, Mid: 0, High: 0 },
      };
    }

    const category = categories[name];
    category.count += 1;
    category.min = Math.min(category.min, price);
    category.max = Math.max(category.max, price);
    category.prices.push(price);
    const status = product.status || "Unknown";
    category.statuses[status] = (category.statuses[status] || 0) + 1;
    category.quantity = (category.quantity || 0) + quantity;
  });

  const maxPrice = Math.max(...products.map((product) => numeric(product.price)), 0);
  products.forEach((product) => {
    const category = categories[categoryName(product)];
    const price = numeric(product.price);
    const band =
      price <= maxPrice / 3 ? "Low" : price <= (maxPrice * 2) / 3 ? "Mid" : "High";
    category.bands[band] += 1;
  });

  return Object.values(categories).map((category) => ({
    ...category,
    average:
      category.prices.reduce((sum, price) => sum + price, 0) /
      Math.max(category.prices.length, 1),
  }));
}

function maxOf(data, key) {
  return Math.max(...data.map((item) => numeric(item[key])), 0);
}

function HorizontalBarChart({ data, labelKey, valueKey }) {
  const items = data.slice(0, 6);
  if (!items.length) return <EmptyChart />;
  const maximum = maxOf(items, valueKey) || 1;

  return (
    <ChartSvg
      label={`Bar chart comparing ${items.map((item) => item[labelKey]).join(", ")}`}
      className="chart-svg-horizontal"
    >
      {items.map((item, index) => {
        const y = 16 + index * 23;
        const width = (numeric(item[valueKey]) / maximum) * 158;
        return (
          <g key={`${item[labelKey]}-${index}`}>
            <text x="0" y={y + 10} className="chart-label">
              {(item[labelKey] || "Item").slice(0, 13)}
            </text>
            <rect x="94" y={y} width="158" height="12" rx="6" fill="#eef2f8" />
            <rect
              x="94"
              y={y}
              width={width}
              height="12"
              rx="6"
              fill={colors[index % colors.length]}
            />
            <text x="258" y={y + 10} className="chart-value">
              {formatNumber(item[valueKey])}
            </text>
          </g>
        );
      })}
    </ChartSvg>
  );
}

function ColumnChart({ data, labelKey, valueKey }) {
  const items = data.slice(0, 7);
  if (!items.length) return <EmptyChart />;
  const maximum = maxOf(items, valueKey) || 1;

  return (
    <ChartSvg label={`Column chart for ${items.map((item) => item[labelKey]).join(", ")}`}>
      {[0, 1, 2, 3].map((line) => (
        <line key={line} x1="20" x2="290" y1={25 + line * 31} y2={25 + line * 31} className="chart-gridline" />
      ))}
      {items.map((item, index) => {
        const x = 28 + index * 37;
        const height = (numeric(item[valueKey]) / maximum) * 104;
        return (
          <g key={`${item[labelKey]}-${index}`}>
            <rect
              x={x}
              y={132 - height}
              width="23"
              height={height}
              rx="4"
              fill={colors[index % colors.length]}
            />
            <text x={x + 11} y="148" textAnchor="middle" className="chart-label">
              {(item[labelKey] || "").slice(0, 5)}
            </text>
          </g>
        );
      })}
      <line x1="20" x2="290" y1="132" y2="132" className="chart-axis" />
    </ChartSvg>
  );
}

function LineChart({ data, labelKey, valueKey }) {
  const items = data.slice(0, 8);
  if (!items.length) return <EmptyChart />;
  const maximum = maxOf(items, valueKey) || 1;
  const points = items.map((item, index) => ({
    x: 24 + index * (252 / Math.max(items.length - 1, 1)),
    y: 126 - (numeric(item[valueKey]) / maximum) * 100,
    item,
  }));

  return (
    <ChartSvg label={`Line chart for ${items.map((item) => item[labelKey]).join(", ")}`}>
      {[0, 1, 2, 3].map((line) => (
        <line key={line} x1="20" x2="290" y1={26 + line * 31} y2={26 + line * 31} className="chart-gridline" />
      ))}
      <polyline
        points={points.map(({ x, y }) => `${x},${y}`).join(" ")}
        fill="none"
        stroke={colors[2]}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map(({ x, y, item }, index) => (
        <g key={`${item[labelKey]}-${index}`}>
          <circle cx={x} cy={y} r="4" fill={colors[2]} />
          <text x={x} y="148" textAnchor="middle" className="chart-label">
            {(item[labelKey] || "").slice(0, 5)}
          </text>
        </g>
      ))}
    </ChartSvg>
  );
}

function AreaChart({ data, labelKey, valueKey }) {
  const items = data.slice(0, 8);
  if (!items.length) return <EmptyChart />;
  const maximum = maxOf(items, valueKey) || 1;
  const points = items.map((item, index) => ({
    x: 24 + index * (252 / Math.max(items.length - 1, 1)),
    y: 126 - (numeric(item[valueKey]) / maximum) * 100,
    item,
  }));
  const path = points.map(({ x, y }) => `${x},${y}`).join(" ");

  return (
    <ChartSvg label={`Area chart for ${items.map((item) => item[labelKey]).join(", ")}`}>
      <polygon points={`24,128 ${path} 276,128`} fill="#ffad4344" />
      <polyline points={path} fill="none" stroke={colors[3]} strokeWidth="3" strokeLinejoin="round" />
      {points.map(({ x, y }, index) => (
        <circle key={index} cx={x} cy={y} r="3" fill={colors[3]} />
      ))}
      <line x1="20" x2="290" y1="130" y2="130" className="chart-axis" />
      {items.map((item, index) => (
        <text
          key={`${item[labelKey]}-${index}`}
          x={points[index].x}
          y="148"
          textAnchor="middle"
          className="chart-label"
        >
          {(item[labelKey] || "").slice(0, 4)}
        </text>
      ))}
    </ChartSvg>
  );
}

function arcPath(cx, cy, radius, startAngle, endAngle, innerRadius = 0) {
  const point = (r, angle) => {
    const radians = ((angle - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(radians), cy + r * Math.sin(radians)];
  };
  const start = point(radius, startAngle);
  const end = point(radius, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  if (!innerRadius) {
    return `M ${cx} ${cy} L ${start[0]} ${start[1]} A ${radius} ${radius} 0 ${largeArc} 1 ${end[0]} ${end[1]} Z`;
  }
  const innerEnd = point(innerRadius, endAngle);
  const innerStart = point(innerRadius, startAngle);
  return `M ${start[0]} ${start[1]} A ${radius} ${radius} 0 ${largeArc} 1 ${end[0]} ${end[1]} L ${innerEnd[0]} ${innerEnd[1]} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart[0]} ${innerStart[1]} Z`;
}

function PieChart({ data, labelKey, valueKey, doughnut = false }) {
  const items = data.filter((item) => numeric(item[valueKey]) > 0).slice(0, 7);
  if (!items.length) return <EmptyChart />;
  const total = items.reduce((sum, item) => sum + numeric(item[valueKey]), 0);
  let angle = 0;

  return (
    <div className="pie-chart-layout">
      <ChartSvg
        label={`${doughnut ? "Doughnut" : "Pie"} chart showing ${items
          .map((item) => item[labelKey])
          .join(", ")}`}
        className="pie-svg"
      >
        {items.length === 1 ? (
          <>
            <circle cx="80" cy="80" r="65" fill={colors[0]} />
            {doughnut && <circle cx="80" cy="80" r="37" fill="#fff" />}
          </>
        ) : (
          items.map((item, index) => {
            const sweep = (numeric(item[valueKey]) / total) * 360;
            const path = arcPath(80, 80, 65, angle, angle + sweep, doughnut ? 37 : 0);
            angle += sweep;
            return <path key={`${item[labelKey]}-${index}`} d={path} fill={colors[index % colors.length]} />;
          })
        )}
        {doughnut && (
          <>
            <text x="80" y="77" textAnchor="middle" className="donut-total">
              {numberFormatter.format(items.length)}
            </text>
            <text x="80" y="94" textAnchor="middle" className="chart-label">
              groups
            </text>
          </>
        )}
      </ChartSvg>
      <ul className="chart-legend">
        {items.map((item, index) => (
          <li key={`${item[labelKey]}-${index}`}>
            <span style={{ backgroundColor: colors[index % colors.length] }} />
            <small>{item[labelKey]}</small>
            <strong>{formatNumber(item[valueKey])}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScatterChart({ products }) {
  const items = products.slice(0, 70);
  if (!items.length) return <EmptyChart />;
  const maxPrice = Math.max(...items.map((item) => numeric(item.price)), 1);
  const maxQuantity = Math.max(...items.map((item) => numeric(item.quantity)), 1);

  return (
    <ChartSvg label="Scatter plot comparing product price and quantity">
      <line x1="28" x2="286" y1="132" y2="132" className="chart-axis" />
      <line x1="28" x2="28" y1="20" y2="132" className="chart-axis" />
      {[0.25, 0.5, 0.75, 1].map((step) => (
        <line key={step} x1="28" x2="286" y1={132 - step * 105} y2={132 - step * 105} className="chart-gridline" />
      ))}
      {items.map((product, index) => (
        <circle
          key={product.id || `${product.name}-${index}`}
          cx={34 + (numeric(product.quantity) / maxQuantity) * 244}
          cy={128 - (numeric(product.price) / maxPrice) * 100}
          r="3.2"
          fill={colors[index % colors.length]}
          opacity="0.8"
        >
          <title>{`${product.name}: ${formatNumber(product.price)} price, ${numberFormatter.format(numeric(product.quantity))} units`}</title>
        </circle>
      ))}
      <text x="135" y="151" textAnchor="middle" className="chart-label">Quantity in stock →</text>
      <text x="9" y="18" className="chart-label">Price</text>
    </ChartSvg>
  );
}

function StackedBarChart({ rows, series }) {
  if (!rows.length || !series.length) return <EmptyChart />;
  const maximum = Math.max(
    ...rows.map((row) => series.reduce((sum, item) => sum + numeric(row.values[item]), 0)),
    1
  );

  return (
    <div>
      <ChartSvg label="Stacked horizontal bars showing product status by category">
        {rows.slice(0, 5).map((row, index) => {
          const y = 17 + index * 26;
          let x = 75;
          return (
            <g key={row.name}>
              <text x="0" y={y + 11} className="chart-label">{row.name.slice(0, 10)}</text>
              {series.map((item, seriesIndex) => {
                const width = (numeric(row.values[item]) / maximum) * 205;
                const rect = (
                  <rect
                    key={item}
                    x={x}
                    y={y}
                    width={width}
                    height="15"
                    rx="2"
                    fill={colors[seriesIndex % colors.length]}
                  >
                    <title>{`${row.name} ${item}: ${formatNumber(row.values[item])}`}</title>
                  </rect>
                );
                x += width;
                return rect;
              })}
            </g>
          );
        })}
      </ChartSvg>
      <Legend series={series} />
    </div>
  );
}

function StackedColumnChart({ rows, series }) {
  if (!rows.length || !series.length) return <EmptyChart />;
  const maximum = Math.max(
    ...rows.map((row) => series.reduce((sum, item) => sum + numeric(row.values[item]), 0)),
    1
  );

  return (
    <div>
      <ChartSvg label="Stacked columns showing product price bands by category">
        {[0, 1, 2, 3].map((line) => (
          <line key={line} x1="20" x2="290" y1={25 + line * 31} y2={25 + line * 31} className="chart-gridline" />
        ))}
        {rows.slice(0, 6).map((row, index) => {
          const x = 30 + index * 42;
          let heightOffset = 0;
          return (
            <g key={row.name}>
              {series.map((item, seriesIndex) => {
                const height = (numeric(row.values[item]) / maximum) * 100;
                const rect = (
                  <rect
                    key={item}
                    x={x}
                    y={128 - heightOffset - height}
                    width="25"
                    height={height}
                    rx="2"
                    fill={colors[seriesIndex % colors.length]}
                  >
                    <title>{`${row.name} ${item}: ${formatNumber(row.values[item])}`}</title>
                  </rect>
                );
                heightOffset += height;
                return rect;
              })}
              <text x={x + 12} y="148" textAnchor="middle" className="chart-label">{row.name.slice(0, 4)}</text>
            </g>
          );
        })}
      </ChartSvg>
      <Legend series={series} />
    </div>
  );
}

function StackedAreaChart({ rows, series }) {
  if (!rows.length || !series.length) return <EmptyChart />;
  const sums = rows.map((row) => series.reduce((sum, key) => sum + numeric(row.values[key]), 0));
  const maximum = Math.max(...sums, 1);
  const xFor = (index) => 24 + index * (252 / Math.max(rows.length - 1, 1));
  let lower = rows.map(() => 0);

  return (
    <div>
      <ChartSvg label="Stacked area chart showing product price bands across categories">
        {series.map((key, seriesIndex) => {
          const upper = rows.map((row, index) => lower[index] + numeric(row.values[key]));
          const points = [
            ...upper.map((value, index) => `${xFor(index)},${128 - (value / maximum) * 105}`),
            ...lower.map((value, index) => `${xFor(rows.length - index - 1)},${128 - (value / maximum) * 105}`),
          ].join(" ");
          const area = (
            <polygon
              key={key}
              points={points}
              fill={colors[seriesIndex % colors.length]}
              opacity="0.78"
            >
              <title>{key}</title>
            </polygon>
          );
          lower = upper;
          return area;
        })}
        {rows.map((row, index) => (
          <text key={row.name} x={xFor(index)} y="148" textAnchor="middle" className="chart-label">
            {row.name.slice(0, 5)}
          </text>
        ))}
      </ChartSvg>
      <Legend series={series} />
    </div>
  );
}

function Legend({ series }) {
  return (
    <ul className="chart-legend chart-legend-inline">
      {series.map((item, index) => (
        <li key={item}>
          <span style={{ backgroundColor: colors[index % colors.length] }} />
          <small>{item}</small>
        </li>
      ))}
    </ul>
  );
}

function RadarChart({ categories }) {
  const items = categories.slice(0, 6);
  if (!items.length) return <EmptyChart />;
  const maxValue = Math.max(...items.map((item) => item.max), 1);
  const center = 150;
  const centerY = 78;
  const radius = 57;
  const angleFor = (index) => (Math.PI * 2 * index) / items.length - Math.PI / 2;
  const polygonPoints = (key) =>
    items
      .map((item, index) => {
        const value = numeric(item[key]) / maxValue;
        const angle = angleFor(index);
        return `${center + Math.cos(angle) * radius * value},${centerY + Math.sin(angle) * radius * value}`;
      })
      .join(" ");

  return (
    <ChartSvg label="Radar chart comparing minimum, average, and maximum price by category">
      {[0.33, 0.66, 1].map((scale) => (
        <polygon
          key={scale}
          points={items.map((_, index) => {
            const angle = angleFor(index);
            return `${center + Math.cos(angle) * radius * scale},${centerY + Math.sin(angle) * radius * scale}`;
          }).join(" ")}
          fill="none"
          stroke="#dce4ef"
        />
      ))}
      {items.map((item, index) => {
        const angle = angleFor(index);
        return (
          <g key={item.name}>
            <line
              x1={center}
              y1={centerY}
              x2={center + Math.cos(angle) * radius}
              y2={centerY + Math.sin(angle) * radius}
              stroke="#dce4ef"
            />
            <text
              x={center + Math.cos(angle) * 75}
              y={centerY + Math.sin(angle) * 75 + 3}
              textAnchor="middle"
              className="chart-label"
            >
              {item.name.slice(0, 7)}
            </text>
          </g>
        );
      })}
      <polygon points={polygonPoints("max")} fill="#3694f533" stroke={colors[0]} />
      <polygon points={polygonPoints("average")} fill="#8965eb33" stroke={colors[1]} />
      <polygon points={polygonPoints("min")} fill="#22bb8c22" stroke={colors[2]} />
    </ChartSvg>
  );
}

function PolarChart({ data, labelKey, valueKey }) {
  const items = data.slice(0, 6).filter((item) => numeric(item[valueKey]) > 0);
  if (!items.length) return <EmptyChart />;
  const maximum = maxOf(items, valueKey) || 1;
  const step = 360 / items.length;

  return (
    <ChartSvg label="Polar chart comparing individual product prices">
      {[20, 38, 56].map((radius) => (
        <circle key={radius} cx="150" cy="78" r={radius} fill="none" stroke="#e0e7f1" />
      ))}
      {items.map((item, index) => {
        const inner = 11;
        const outer = inner + (numeric(item[valueKey]) / maximum) * 47;
        const start = index * step + 3;
        return (
          <path
            key={`${item[labelKey]}-${index}`}
            d={arcPath(150, 78, outer, start, start + step - 6, inner)}
            fill={colors[index % colors.length]}
          >
            <title>{`${item[labelKey]}: ${formatNumber(item[valueKey])}`}</title>
          </path>
        );
      })}
    </ChartSvg>
  );
}

function Heatmap({ rows, series }) {
  if (!rows.length) return <EmptyChart />;
  const maximum = Math.max(...rows.flatMap((row) => series.map((key) => numeric(row.values[key]))), 1);

  return (
    <ChartSvg label="Heatmap showing product count by category and price band">
      <text x="3" y="13" className="chart-label">Category</text>
      {series.map((key, col) => (
        <text key={key} x={100 + col * 61} y="14" textAnchor="middle" className="chart-label">{key}</text>
      ))}
      {rows.slice(0, 6).map((row, rowIndex) => (
        <g key={row.name}>
          <text x="3" y={39 + rowIndex * 20} className="chart-label">{row.name.slice(0, 10)}</text>
          {series.map((key, col) => {
            const value = numeric(row.values[key]);
            const opacity = 0.12 + (value / maximum) * 0.78;
            return (
              <g key={key}>
                <rect
                  x={74 + col * 61}
                  y={23 + rowIndex * 20}
                  width="52"
                  height="17"
                  rx="3"
                  fill={`rgba(54, 148, 245, ${opacity})`}
                />
                <text x={100 + col * 61} y={35 + rowIndex * 20} textAnchor="middle" className="heatmap-value">
                  {numberFormatter.format(value)}
                </text>
              </g>
            );
          })}
        </g>
      ))}
    </ChartSvg>
  );
}

function Treemap({ data, labelKey, valueKey }) {
  const items = data.filter((item) => numeric(item[valueKey]) > 0).slice(0, 7);
  if (!items.length) return <EmptyChart />;
  const total = items.reduce((sum, item) => sum + numeric(item[valueKey]), 0);
  let x = 0;

  return (
    <ChartSvg label="Treemap showing total product price contribution by category">
      {items.map((item, index) => {
        const width = (numeric(item[valueKey]) / total) * 280;
        const rect = (
          <g key={`${item[labelKey]}-${index}`}>
            <rect
              x={10 + x}
              y="12"
              width={Math.max(width - 3, 0)}
              height="120"
              rx="5"
              fill={colors[index % colors.length]}
            />
            {width > 33 && (
              <>
                <text x={15 + x} y="66" className="treemap-label">{item[labelKey].slice(0, 10)}</text>
                {width > 62 && (
                  <text x={15 + x} y="83" className="treemap-value">
                    {formatNumber(item[valueKey])}
                  </text>
                )}
              </>
            )}
          </g>
        );
        x += width;
        return rect;
      })}
    </ChartSvg>
  );
}

function GaugeChart({ average, highest }) {
  if (!Number.isFinite(Number(average)) || !Number.isFinite(Number(highest))) return <EmptyChart />;
  const max = numeric(highest) || 1;
  const ratio = Math.min(numeric(average) / max, 1);
  const angle = Math.PI - ratio * Math.PI;
  const needleX = 150 + Math.cos(angle) * 76;
  const needleY = 120 - Math.sin(angle) * 76;

  return (
    <ChartSvg label={`Gauge chart: average price ${formatNumber(average)} of maximum ${formatNumber(highest)}`}>
      <path d="M 40 122 A 110 110 0 0 1 260 122" fill="none" stroke="#e6edf5" strokeWidth="18" strokeLinecap="round" />
      <path d="M 40 122 A 110 110 0 0 1 86 31" fill="none" stroke="#ed6688" strokeWidth="18" />
      <path d="M 86 31 A 110 110 0 0 1 150 12" fill="none" stroke="#ffad43" strokeWidth="18" />
      <path d="M 150 12 A 110 110 0 0 1 214 31" fill="none" stroke="#f3d54e" strokeWidth="18" />
      <path d="M 214 31 A 110 110 0 0 1 260 122" fill="none" stroke="#22bb8c" strokeWidth="18" />
      <line x1="150" y1="120" x2={needleX} y2={needleY} stroke="#243756" strokeWidth="5" strokeLinecap="round" />
      <circle cx="150" cy="120" r="8" fill="#243756" />
      <text x="150" y="104" textAnchor="middle" className="gauge-value">{formatNumber(average)}</text>
      <text x="36" y="147" className="chart-label">0</text>
      <text x="264" y="147" textAnchor="end" className="chart-label">{formatNumber(highest)}</text>
    </ChartSvg>
  );
}

function QueryVisualizations({ results, loading }) {
  if (loading) {
    return (
      <section className="visualizations-section" aria-labelledby="visualizations-heading">
        <div className="visualizations-heading">
          <div>
            <h2 id="visualizations-heading">Overview of your data at a glance</h2>
            <p>Loading product analytics...</p>
          </div>
        </div>
        <p className="visualization-loading">Loading visualizations...</p>
      </section>
    );
  }
  if (!results) return null;

  const arrayResult = (key) => (Array.isArray(results[key]) ? results[key] : []);
  const products = arrayResult("products_with_category");
  const categoryStats = getProductStats(products);
  const sortedAverages = arrayResult("average_price_sorted");
  const averageByCategory = arrayResult("average_price_per_category");
  const lowestByCategory = arrayResult("lowest_price_per_category");
  const totalByCategory = arrayResult("total_price_per_category");
  const namesAndPrices = arrayResult("name_and_price");
  const firstFive = arrayResult("first_five_products");
  const categoryCounts = getCategoryCounts(products);
  const countRows = categoryStats.map((category) => ({
    name: category.name,
    values: category.bands,
  }));
  const statusNames = [...new Set(categoryStats.flatMap((category) => Object.keys(category.statuses)))];
  const statusRows = categoryStats.map((category) => ({
    name: category.name,
    values: category.statuses,
  }));
  const categoryAverageRows = averageByCategory.map((category) => ({
    name: category.name,
    average: numeric(category.avg_price),
    min:
      numeric(lowestByCategory.find((item) => item.name === category.name)?.min_price) ||
      categoryStats.find((item) => item.name === category.name)?.min ||
      0,
    max: categoryStats.find((item) => item.name === category.name)?.max || 0,
  }));
  const pieData = totalByCategory;
  const donutData = Object.entries(categoryCounts).map(([name, count]) => ({ name, count }));

  return (
    <section className="visualizations-section" aria-labelledby="visualizations-heading">
      <div className="visualizations-heading">
        <div>
          <h2 id="visualizations-heading">Overview of your data at a glance</h2>
          <p>15 chart types built from your product and category query results.</p>
        </div>
      </div>

      <div className="visualizations-grid">
        <ChartPanel title="Product price comparison" type="Bar Chart">
          <HorizontalBarChart data={namesAndPrices} labelKey="name" valueKey="price" />
        </ChartPanel>
        <ChartPanel title="Total price by category" type="Column Chart">
          <ColumnChart data={totalByCategory} labelKey="name" valueKey="total_price" />
        </ChartPanel>
        <ChartPanel title="Average price by category" type="Line Chart">
          <LineChart data={sortedAverages} labelKey="name" valueKey="avg_price" />
        </ChartPanel>
        <ChartPanel title="First five product prices" type="Area Chart">
          <AreaChart data={firstFive} labelKey="name" valueKey="price" />
        </ChartPanel>
        <ChartPanel title="Category share of total price" type="Pie Chart">
          <PieChart data={pieData} labelKey="name" valueKey="total_price" />
        </ChartPanel>
        <ChartPanel title="Products by category" type="Doughnut Chart">
          <PieChart data={donutData} labelKey="name" valueKey="count" doughnut />
        </ChartPanel>
        <ChartPanel title="Price vs. units in stock" type="Scatter Plot">
          <ScatterChart products={products} />
        </ChartPanel>
        <ChartPanel title="Product status by category" type="Stacked Bar Chart">
          <StackedBarChart rows={statusRows} series={statusNames} />
        </ChartPanel>
        <ChartPanel title="Price bands by category" type="Stacked Column Chart">
          <StackedColumnChart rows={countRows} series={priceBands} />
        </ChartPanel>
        <ChartPanel title="Category price-band mix" type="Stacked Area Chart">
          <StackedAreaChart rows={countRows} series={priceBands} />
        </ChartPanel>
        <ChartPanel title="Price range by category" type="Radar Chart">
          <RadarChart categories={categoryAverageRows} />
        </ChartPanel>
        <ChartPanel title="Top product prices" type="Polar Chart">
          <PolarChart data={namesAndPrices} labelKey="name" valueKey="price" />
        </ChartPanel>
        <ChartPanel title="Products by category and price band" type="Heatmap">
          <Heatmap rows={countRows} series={priceBands} />
        </ChartPanel>
        <ChartPanel title="Category contribution to price" type="Treemap">
          <Treemap data={pieData} labelKey="name" valueKey="total_price" />
        </ChartPanel>
        <ChartPanel title="Average price against maximum" type="Gauge Chart">
          <GaugeChart average={results.average_price} highest={results.highest_price} />
        </ChartPanel>
      </div>
    </section>
  );
}

export default QueryVisualizations;
