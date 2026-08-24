import React from 'react';

export const Skeleton = ({ className = '', dk = false }) => {
  return (
    <div
      className={`animate-pulse rounded-md ${
        dk ? 'bg-white/[0.08]' : 'bg-slate-200'
      } ${className}`}
    />
  );
};

export const PatientSkeleton = ({ dk }) => (
  <div className={`rounded-2xl border p-5 animate-pulse ${
    dk ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-100 bg-slate-50'
  }`}>
    <div className="flex items-start gap-3.5 mb-4">
      <Skeleton className="h-10 w-10 shrink-0 rounded-xl" dk={dk} />
      <div className="min-w-0 flex-1 space-y-2 py-1">
        <Skeleton className="h-4 rounded w-2/3" dk={dk} />
        <Skeleton className="h-3 rounded w-1/3" dk={dk} />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" dk={dk} />
    </div>
    <div className={`mb-4 h-px ${dk ? 'bg-white/[0.05]' : 'bg-slate-100'}`} />
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-2.5 rounded w-1/2" dk={dk} />
          <Skeleton className="h-4 rounded w-3/4" dk={dk} />
        </div>
      ))}
    </div>
    <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.05]">
      <Skeleton className="flex-1 h-8 rounded-lg" dk={dk} />
      <Skeleton className="flex-1 h-8 rounded-lg" dk={dk} />
      <Skeleton className="h-8 w-8 rounded-lg" dk={dk} />
    </div>
  </div>
);

export const ReportSkeleton = ({ dk }) => (
  <div className={`rounded-xl border p-4 animate-pulse flex items-center justify-between gap-4 ${
    dk ? 'border-white/[0.06] bg-white/[0.01]' : 'border-slate-100 bg-slate-50/50'
  }`}>
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <Skeleton className="h-9 w-9 shrink-0 rounded-lg" dk={dk} />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 rounded w-1/4" dk={dk} />
          <Skeleton className="h-3 rounded w-16" dk={dk} />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-3 rounded w-20" dk={dk} />
          <Skeleton className="h-3 rounded w-16" dk={dk} />
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3 shrink-0">
      <Skeleton className="h-4 w-12 rounded" dk={dk} />
      <Skeleton className="h-7 w-7 rounded-lg" dk={dk} />
    </div>
  </div>
);

export const ArchiveSkeleton = ({ dk }) => (
  <div className="space-y-2 animate-pulse">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
        dk ? 'border-white/[0.05] bg-white/[0.01]' : 'border-slate-100 bg-white'
      }`}>
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3.5 rounded w-1/3" dk={dk} />
          <Skeleton className="h-3 rounded w-1/2" dk={dk} />
        </div>
        <Skeleton className="h-5 w-12 rounded-full shrink-0" dk={dk} />
      </div>
    ))}
  </div>
);

export const VisualizerSkeleton = ({ dk }) => (
  <div className="h-full w-full flex flex-col p-4 animate-pulse justify-between">
    <div className="flex justify-between items-center mb-4">
      <Skeleton className="h-4 w-1/4" dk={dk} />
      <Skeleton className="h-4 w-1/3" dk={dk} />
    </div>
    <div className="flex-1 flex items-center justify-center relative">
      <div className={`h-48 w-48 rounded-full border-4 border-dashed animate-spin ${
        dk ? 'border-sky-500/10' : 'border-sky-500/20'
      }`} />
      <div className={`absolute h-40 w-40 rounded-full border-4 border-dashed animate-ping ${
        dk ? 'border-sky-500/5' : 'border-sky-500/10'
      }`} />
    </div>
    <div className="space-y-2 mt-4">
      <Skeleton className="h-3.5 rounded w-2/3" dk={dk} />
      <Skeleton className="h-3 rounded w-1/2" dk={dk} />
    </div>
  </div>
);

export const MetricsSkeleton = ({ dk }) => (
  <div className="grid grid-cols-1 gap-3 md:grid-cols-3 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className={`rounded-xl border p-4 ${
        dk ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-100 bg-slate-50'
      } space-y-2.5`}>
        <Skeleton className="h-3 rounded w-2/3" dk={dk} />
        <Skeleton className="h-4 rounded w-1/2" dk={dk} />
        <Skeleton className="h-2 rounded w-3/4" dk={dk} />
      </div>
    ))}
  </div>
);
