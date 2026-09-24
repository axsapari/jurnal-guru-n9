import React from 'react';
import { SchoolConfig } from '../types';

interface KopSuratProps {
  config: SchoolConfig;
  title?: string;
  subtitle?: string;
}

export const KopSurat: React.FC<KopSuratProps> = ({ config, title, subtitle }) => {
  return (
    <div className="w-full text-slate-900 mb-6 font-serif">
      <div className="flex items-center justify-between gap-4 pb-3">
        {/* Logo Kiri: Pemerintah Kota/Kabupaten */}
        <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center">
          {config.cityLogoUrl ? (
            <img
              src={config.cityLogoUrl}
              alt="Logo Pemerintah Kota/Kabupaten"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="w-16 h-16 rounded-md border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400 text-center p-1 font-sans">
              Logo Kota/Kab.
            </div>
          )}
        </div>

        {/* Text Header — di tengah */}
        <div className="flex-1 text-center">
          {config.governmentLine1 && (
            <h3 className="text-base uppercase tracking-wide font-bold text-slate-900 leading-tight">
              {config.governmentLine1}
            </h3>
          )}
          {config.governmentLine2 && (
            <h3 className="text-base uppercase tracking-wide font-bold text-slate-900 leading-tight">
              {config.governmentLine2}
            </h3>
          )}
          <h2 className="text-lg uppercase tracking-wide font-bold text-slate-900 leading-tight my-0.5">
            {config.schoolName}
          </h2>
          <p className="text-[12px] text-slate-800 font-sans leading-snug">
            {config.address}
          </p>
          <p className="text-[12px] text-slate-800 font-sans leading-snug">
            {config.email ? `Surel: ${config.email}` : ''}{config.website ? `   Laman: ${config.website}` : ''}
          </p>
        </div>

        {/* Logo Kanan: Logo Sekolah */}
        <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center">
          {config.logoUrl ? (
            <img
              src={config.logoUrl}
              alt="Logo Sekolah"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="w-16 h-16 rounded-md border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400 text-center p-1 font-sans">
              Logo Sekolah
            </div>
          )}
        </div>
      </div>

      {/* Double Divider Line for Official Kop Surat */}
      <div className="border-b-4 border-slate-900 mb-1"></div>
      <div className="border-b-1 border-slate-900 mb-4"></div>

      {/* Report Title */}
      {title && (
        <div className="text-center my-4 font-sans">
          <h1 className="text-lg font-bold uppercase underline tracking-wide text-slate-900">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-600 font-medium mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
