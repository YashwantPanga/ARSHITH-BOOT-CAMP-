import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Reveal, SafeImg } from './ui';
import { IMAGES } from '../data/meta';

export default function CtaSection({ onExploreClick }) {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="relative overflow-hidden rounded-[2rem] bg-brand-900 text-white">
          <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />
          <div className="relative grid md:grid-cols-2 items-center">
            <div className="p-8 sm:p-12 lg:p-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-peach-400">Get control of your learning</p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold leading-tight">Start today. Finish with a certificate that proves it.</h2>
              <p className="mt-4 text-brand-100 max-w-md">Free courses, real assessments and a credential with your exact score and a unique ID employers can verify online.</p>
              <button onClick={onExploreClick} className="btn bg-ivory text-brand-900 hover:bg-white mt-8 px-7 py-3.5 group">
                Choose your course <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
            <div className="relative h-64 md:h-full min-h-[18rem]">
              <SafeImg src={IMAGES.heroLaptop} alt="Learning on a laptop" className="absolute inset-0 w-full h-full object-cover md:[clip-path:polygon(18%_0,100%_0,100%_100%,0_100%)]" />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-900/70 via-brand-900/10 to-transparent md:hidden" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
