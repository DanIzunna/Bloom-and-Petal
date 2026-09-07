import Link from "next/link";
import { Flower2, ArrowRight, Home } from "lucide-react";

export default function NotFoundContent() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#FAF8F5] px-5 py-20">
      <div className="w-full max-w-2xl text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-[#e4eee7] text-[#2f5d50]">
          <Flower2 size={34} strokeWidth={1.5} />
        </div>

        <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.2em] text-[#68816e]">
          A little garden detour
        </p>

        <h1 className="mt-3 font-sans text-4xl tracking-[-0.03em] text-[#27332f] sm:text-5xl">
          This bloom isn&apos;t available
        </h1>

        <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-[#81786f] sm:text-base">
          The arrangement you&apos;re looking for may have gone out of season,
          moved somewhere else, or simply never made it into our garden.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/products"
            className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#2f5d50] px-6 text-xs font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#24483d]"
          >
            Explore All Blooms
            <ArrowRight size={16} />
          </Link>

          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#ddd6ce] bg-white px-6 text-xs font-bold uppercase tracking-[0.16em] text-[#27332f] transition-colors hover:border-[#b65e6d] hover:bg-[#f3e8e3]"
          >
            <Home size={15} />
            Return to Home
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          <Link
            href="/products?category=bouquets"
            className="rounded-full border border-[#ddd6ce] bg-white px-4 py-2 text-xs font-semibold text-[#68756b] transition-colors hover:border-[#2f5d50] hover:text-[#2f5d50]"
          >
            Fresh Bouquets
          </Link>

          <Link
            href="/products?category=plants"
            className="rounded-full border border-[#ddd6ce] bg-white px-4 py-2 text-xs font-semibold text-[#68756b] transition-colors hover:border-[#2f5d50] hover:text-[#2f5d50]"
          >
            Indoor Plants
          </Link>

          <Link
            href="/products"
            className="rounded-full border border-[#ddd6ce] bg-white px-4 py-2 text-xs font-semibold text-[#68756b] transition-colors hover:border-[#2f5d50] hover:text-[#2f5d50]"
          >
            Best Sellers
          </Link>
        </div>
      </div>
    </main>
  );
}
