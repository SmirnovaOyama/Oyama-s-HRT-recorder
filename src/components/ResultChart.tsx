import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { formatDate, formatTime } from '../utils/helpers';
import { SimulationResult, DoseEvent, interpolateConcentration } from '../../logic';
import { Activity, RotateCcw } from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart, Scatter
} from 'recharts';

const CustomTooltip = ({ active, payload, label, t, lang }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl border border-pink-100/50">
                <p className="text-[10px] font-medium text-gray-400 mb-0.5">
                    {formatDate(new Date(label), lang)} {formatTime(new Date(label))}
                </p>
                <div className="flex items-baseline gap-1">
                    <span className="text-base font-black text-pink-500 tracking-tight">
                        {payload[0].value.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-bold text-pink-300">pg/mL</span>
                </div>
            </div>
        );
    }
    return null;
};

const ResultChart = ({ sim, events, onPointClick }: { sim: SimulationResult | null, events: DoseEvent[], onPointClick: (e: DoseEvent) => void }) => {
    const { t, lang } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const [xDomain, setXDomain] = useState<[number, number] | null>(null);
    const initializedRef = useRef(false);

    const data = useMemo(() => {
        if (!sim || sim.timeH.length === 0) return [];
        return sim.timeH.map((t, i) => ({
            time: t * 3600000, 
            conc: sim.concPGmL[i]
        }));
    }, [sim]);

    const eventPoints = useMemo(() => {
        if (!sim || events.length === 0) return [];
        
        // Map events to data points, find closest concentration from sim
        return events.map(e => {
            const timeMs = e.timeH * 3600000;
            // Find closest time in sim
            const closestIdx = sim.timeH.reduce((prev, curr, i) => 
                Math.abs(curr * 3600000 - timeMs) < Math.abs(sim.timeH[prev] * 3600000 - timeMs) ? i : prev
            , 0);
            
            return {
                time: timeMs,
                conc: sim.concPGmL[closestIdx],
                event: e
            };
        });
    }, [sim, events]);

    const { minTime, maxTime, now } = useMemo(() => {
        const n = new Date().getTime();
        if (data.length === 0) return { minTime: n, maxTime: n, now: n };
        return {
            minTime: data[0].time,
            maxTime: data[data.length - 1].time,
            now: n
        };
    }, [data]);

    const nowPoint = useMemo(() => {
        if (!sim || data.length === 0) return null;
        const conc = interpolateConcentration(sim, now / 3600000);
        if (conc === null || Number.isNaN(conc)) return null;
        return { time: now, conc };
    }, [sim, data, now]);

    // Slider helpers for quick panning (helps mobile users)
    const visibleWidth = useMemo(() => {
        if (!xDomain) return Math.max(maxTime - minTime, 1);
        return Math.max(xDomain[1] - xDomain[0], 1);
    }, [xDomain, minTime, maxTime]);
    const sliderMin = minTime;
    const sliderMax = Math.max(maxTime - visibleWidth, sliderMin);
    const sliderValue = xDomain ? xDomain[0] : minTime;

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = Number(e.target.value);
        if (Number.isNaN(v)) return;
        const start = Math.max(sliderMin, Math.min(v, sliderMax));
        const end = start + visibleWidth;
        setXDomain([start, end]);
    };

    // Initialize view: center on "now" with a reasonable window (e.g. 14 days)
    useEffect(() => {
        if (!initializedRef.current && data.length > 0) {
            const initialWindow = 14 * 24 * 3600 * 1000; // 2 weeks
            const start = Math.max(minTime, now - initialWindow / 2);
            const end = Math.min(maxTime, start + initialWindow);
            
            // Adjust if end is clamped
            const finalStart = Math.max(minTime, end - initialWindow);
            
            setXDomain([finalStart, end]);
            initializedRef.current = true;
        }
    }, [data, minTime, maxTime, now]);

    const clampDomain = (domain: [number, number]): [number, number] => {
        const width = domain[1] - domain[0];
        // Enforce min zoom (e.g. 1 day) and max zoom (total range)
        const MIN_ZOOM = 24 * 3600 * 1000;
        const MAX_ZOOM = Math.max(maxTime - minTime, MIN_ZOOM);

        let newWidth = Math.max(MIN_ZOOM, Math.min(width, MAX_ZOOM));
        let newStart = domain[0];
        let newEnd = newStart + newWidth;

        // Clamp to data bounds
        if (newStart < minTime) {
            newStart = minTime;
            newEnd = newStart + newWidth;
        }
        if (newEnd > maxTime) {
            newEnd = maxTime;
            newStart = newEnd - newWidth;
        }
        
        return [newStart, newEnd];
    };

    const zoomToDuration = (days: number) => {
        const duration = days * 24 * 3600 * 1000;
        const currentCenter = xDomain ? (xDomain[0] + xDomain[1]) / 2 : now;
        const targetCenter = (now >= minTime && now <= maxTime) ? now : currentCenter;
        
        const start = targetCenter - duration / 2;
        const end = targetCenter + duration / 2;
        setXDomain(clampDomain([start, end]));
    };

    if (!sim || sim.timeH.length === 0) return (
        <div className="h-72 md:h-96 flex flex-col items-center justify-center text-gray-400 bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <Activity className="w-12 h-12 mb-4 text-gray-200" strokeWidth={1.5} />
            <p className="text-sm font-medium">{t('timeline.empty')}</p>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-4 md:px-6 py-3 md:py-4 border-b border-gray-100">
                <h2 className="text-sm md:text-base font-semibold text-gray-800 tracking-tight flex items-center gap-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif' }}>
                    <span className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl bg-pink-50 border border-pink-100">
                        <Activity size={16} className="text-[#f6c4d7] md:w-5 md:h-5" />
                    </span>
                    {t('chart.title')}
                </h2>

                <div className="flex bg-gray-50 rounded-xl p-1 gap-1 border border-gray-100">
                    <button
                        onClick={() => zoomToDuration(30)}
                        className="px-3 py-1.5 text-xs md:text-sm font-bold text-gray-600 rounded-lg hover:bg-white transition-all">
                        1M
                    </button>
                    <button
                        onClick={() => zoomToDuration(7)}
                        className="px-3 py-1.5 text-xs md:text-sm font-bold text-gray-600 rounded-lg hover:bg-white transition-all">
                        1W
                    </button>
                    <div className="w-px h-4 bg-gray-200 self-center mx-1"></div>
                    <button
                        onClick={() => {
                            setXDomain(clampDomain([minTime, maxTime]));
                        }}
                        className="p-1.5 text-gray-600 rounded-lg hover:bg-white transition-all"
                    >
                        <RotateCcw size={14} className="md:w-4 md:h-4" />
                    </button>
                </div>
            </div>

            <div
                ref={containerRef}
                className="h-64 md:h-80 lg:h-96 w-full touch-none relative select-none px-2 pb-2">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart margin={{ top: 12, right: 8, bottom: 0, left: -12 }}>
                        <defs>
                            <linearGradient id="colorConc" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f6c4d7" stopOpacity={0.18}/>
                                <stop offset="95%" stopColor="#f6c4d7" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f7" />
                        <XAxis 
                            dataKey="time" 
                            type="number" 
                            domain={xDomain || ['auto', 'auto']}
                            allowDataOverflow={true}
                            tickFormatter={(ms) => formatDate(new Date(ms), lang)}
                            tick={{fontSize: 10, fill: '#9aa3b1', fontWeight: 600}}
                            minTickGap={48}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                        />
                        <YAxis 
                            dataKey="conc"
                            tick={{fontSize: 10, fill: '#9aa3b1', fontWeight: 600}}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip 
                            content={<CustomTooltip t={t} lang={lang} />} 
                            cursor={{ stroke: '#f6c4d7', strokeWidth: 1, strokeDasharray: '4 4' }} 
                            trigger="hover"
                        />
                        <ReferenceLine x={now} stroke="#f6c4d7" strokeDasharray="3 3" strokeWidth={1.2} />
                        <Area 
                            data={data}
                            type="monotone" 
                            dataKey="conc" 
                            stroke="#f6c4d7" 
                            strokeWidth={2.2} 
                            fillOpacity={0.95} 
                            fill="url(#colorConc)" 
                            isAnimationActive={false}
                            activeDot={{ r: 6, strokeWidth: 3, stroke: '#fff', fill: '#ec4899' }} 
                        />
                        <Scatter 
                            data={nowPoint ? [nowPoint] : []}
                            isAnimationActive={false}
                            shape={({ cx, cy, payload }: any) => {
                                const conc = payload?.conc ?? 0;
                                const radius = Math.min(7, Math.max(3, Math.sqrt(Math.max(conc, 0)) * 0.25));
                                return (
                                    <g className="group">
                                        <circle cx={cx} cy={cy} r={1} fill="transparent" />
                                        <circle 
                                            cx={cx} cy={cy} 
                                            r={radius} 
                                            fill="#bfdbfe" 
                                            stroke="white" 
                                            strokeWidth={1.5} 
                                        />
                                    </g>
                                );
                            }}
                        />
                        <Scatter 
                            data={eventPoints} 
                            isAnimationActive={false}
                            shape={(props: any) => {
                                const { cx, cy, payload } = props;
                                // Calculate radius based on dose (min 2px, max 6px approx)
                                // Standard dose ranges: 0.5mg - 10mg
                                const dose = payload.event.doseMG;
                                const radius = Math.min(6, Math.max(2, Math.sqrt(dose) * 2));
                                
                                return (
                                    <g className="group">
                                        {/* Invisible hit target for hovering */}
                                        <circle cx={cx} cy={cy} r={1} fill="transparent" />
                                        {/* Visible dot with scale effect */}
                                        <circle 
                                            cx={cx} cy={cy} r={radius} 
                                            fill="#f6c4d7" stroke="white" strokeWidth={1.5} 
                                        />
                                    </g>
                                );
                            }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            {/* Compact external slider for precise panning (mobile friendly) */}
            {data.length > 1 && (
                <div className="mt-2 px-4 pb-3">
                    <input
                        type="range"
                        min={String(sliderMin)}
                        max={String(sliderMax)}
                        value={String(sliderValue)}
                        onChange={handleSliderChange}
                        className="w-full accent-pink-300 h-1.5 rounded-full bg-gray-100"
                    />
                </div>
            )}
        </div>
    );
};

export default ResultChart;
