"use client";

import { AuditPayload, Recommendation } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { AlertCircleIcon, ArrowRightIcon, BarChart2Icon, ZapIcon, TargetIcon, UsersIcon } from "lucide-react";

export function FinalReport({ payload }: { payload: AuditPayload }) {
  const { scores, recommendations, competitors } = payload;

  return (
    <div className="flex flex-col gap-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-4">
        <h1 className="text-4xl font-extrabold tracking-tight">ASO Audit Complete</h1>
        <p className="text-muted-foreground mt-2">Here is the detailed breakdown of your app's performance.</p>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 flex flex-col items-center justify-center p-6 shadow-md">
          <h2 className="text-lg font-semibold text-muted-foreground mb-2">Overall Score</h2>
          <div className="relative flex items-center justify-center">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-muted/20"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray="440"
                strokeDashoffset={440 - (440 * (scores?.overall || 0)) / 100}
                className="text-primary transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute text-5xl font-black">{Math.round(scores?.overall || 0)}</div>
          </div>
        </Card>

        <Card className="md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2Icon className="w-5 h-5 text-primary" />
              Dimension Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(scores || {})
                .filter(([k]) => k !== 'overall')
                .map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize font-medium">{key}</span>
                      <span className="text-muted-foreground">{val as number}/10</span>
                    </div>
                    <Progress value={(val as number) * 10} className="h-2" />
                  </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">Actionable Recommendations</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Wins */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <ZapIcon className="w-5 h-5" />
              <h3 className="font-semibold text-lg">Quick Wins</h3>
            </div>
            {recommendations?.quickWins?.map((rec, i) => <RecommendationCard key={i} rec={rec} />)}
          </div>

          {/* High Impact */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertCircleIcon className="w-5 h-5" />
              <h3 className="font-semibold text-lg">High Impact</h3>
            </div>
            {recommendations?.highImpact?.map((rec, i) => <RecommendationCard key={i} rec={rec} />)}
          </div>

          {/* Strategic */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <TargetIcon className="w-5 h-5" />
              <h3 className="font-semibold text-lg">Strategic</h3>
            </div>
            {recommendations?.strategic?.map((rec, i) => <RecommendationCard key={i} rec={rec} />)}
          </div>
        </div>
      </div>

      {/* Competitors */}
      {competitors && competitors.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-primary" />
              Competitor Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Competitor ID</th>
                    <th className="px-4 py-3">Title</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((comp, idx) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{comp.id || 'Unknown'}</td>
                      <td className="px-4 py-3">{comp.title || 'Unknown App'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-primary">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <h4 className="font-bold leading-tight">{rec.title}</h4>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{rec.category}</Badge>
        </div>
        
        <p className="text-sm text-muted-foreground leading-snug">{rec.reasoning}</p>
        
        <div className="bg-muted/50 p-3 rounded-md text-sm border">
          <p className="font-semibold mb-1 text-xs uppercase tracking-wider text-muted-foreground">Evidence</p>
          <p>{rec.evidence}</p>
        </div>

        {(rec.before || rec.after) && (
          <div className="flex items-center gap-2 text-xs font-medium mt-1">
            {rec.before && <span className="line-through text-destructive px-2 py-1 bg-destructive/10 rounded">{rec.before}</span>}
            <ArrowRightIcon className="w-4 h-4 text-muted-foreground" />
            {rec.after && <span className="text-green-600 dark:text-green-400 px-2 py-1 bg-green-500/10 rounded">{rec.after}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
