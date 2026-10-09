import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import type { Lang, Visual } from "@/lib/assessment";

const COLORS = ["#23765d", "#d39c60"];
const number = (n: number) => n.toLocaleString("en-MY");

/** The chart or mini dashboard a candidate reads to answer a data question. */
export function QuestionVisual({
  visual,
  lang,
}: {
  visual: Visual;
  lang: Lang;
}) {
  if (visual.kind === "bar") {
    const data = visual.categories[lang].map((name, i) => ({
      name,
      ...Object.fromEntries(
        visual.series.map((s, j) => ["s" + j, s.values[i]]),
      ),
    }));
    return (
      <figure className="question-visual" aria-label={visual.title[lang]}>
        <figcaption>{visual.title[lang]}</figcaption>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart
            data={data}
            margin={{ top: 22, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="#edf1ec" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "#4f6458" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            {visual.series.map((s, j) => (
              <Bar
                key={j}
                dataKey={"s" + j}
                name={s.name[lang]}
                fill={COLORS[j % COLORS.length]}
                radius={[4, 4, 0, 0]}
                maxBarSize={56}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey={"s" + j}
                  position="top"
                  formatter={(v: any) => number(Number(v))}
                  style={{ fontSize: 11, fill: "#304a3d" }}
                />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
        {visual.series.length > 1 && (
          <div className="chart-legend">
            {visual.series.map((s, j) => (
              <span key={j}>
                <i style={{ background: COLORS[j % COLORS.length] }} />
                {s.name[lang]}
              </span>
            ))}
          </div>
        )}
      </figure>
    );
  }
  return (
    <figure
      className="question-visual dashboard"
      aria-label={visual.title[lang]}
    >
      <figcaption>{visual.title[lang]}</figcaption>
      <div className="visual-tiles">
        {visual.tiles.map((tile) => (
          <div key={tile.label.en}>
            <strong>{tile.value}</strong>
            <span>{tile.label[lang]}</span>
          </div>
        ))}
      </div>
      <table>
        <thead>
          <tr>
            {visual.columns[lang].map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visual.rows[lang].map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) => (
                <td key={i}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
