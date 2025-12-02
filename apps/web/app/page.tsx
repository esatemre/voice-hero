'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight, Mic, BarChart3, Zap, Play, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col font-sans overflow-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-slate-950 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/20 blur-[120px] rounded-full -z-10"></div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="bg-primary text-primary-foreground p-1 rounded-lg">
              <Mic className="h-5 w-5" />
            </div>
            <span>Landing Voice Agent</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="#early-access">
              <Button size="sm" className="rounded-full">Get Early Access</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 md:pt-32 md:pb-48 overflow-hidden">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="container mx-auto flex flex-col items-center text-center px-4 md:px-6"
          >
            <motion.div variants={item}>
              <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5 text-sm border-primary/20 bg-primary/5 text-primary">
                ✨ Live Hackathon Demo
              </Badge>
            </motion.div>

            <motion.h1 variants={item} className="max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl mb-6">
              Your homepage, <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 animate-gradient">
                now with a voice.
              </span>
            </motion.h1>

            <motion.p variants={item} className="max-w-2xl text-lg text-muted-foreground mb-10 leading-relaxed sm:text-xl">
              Don&apos;t let visitors read in silence. Landing Voice Agent adds a
              <span className="font-semibold text-foreground"> self-optimizing 20-second audio intro </span>
              that adapts to every visitor.
            </motion.p>

            <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="#early-access">
                <Button size="lg" className="h-12 px-8 rounded-full text-base w-full sm:w-auto shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all">
                  Get Early Access <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo.html" target="_blank">
                <Button variant="outline" size="lg" className="h-12 px-8 rounded-full text-base w-full sm:w-auto backdrop-blur-sm bg-background/50">
                  <Play className="mr-2 h-4 w-4" /> Live Demo
                </Button>
              </Link>
            </motion.div>

            {/* Visual Abstract Representation */}
            <motion.div
              variants={item}
              className="mt-20 relative w-full max-w-3xl aspect-[16/9] bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  {/* Visitor Node */}
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                    <span className="text-2xl">👤</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Visitor</span>
                </div>

                {/* Connection Line */}
                <div className="w-24 h-0.5 bg-gradient-to-r from-slate-700 to-blue-500 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6] animate-pulse"></div>
                </div>

                {/* AI Core */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20 z-10 relative">
                    <Mic className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-blue-500 blur-xl opacity-50 animate-pulse"></div>
                </div>

                {/* Connection Line */}
                <div className="w-24 h-0.5 bg-gradient-to-r from-violet-500 to-slate-700"></div>

                {/* Output Node */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                    <Volume2 className="w-6 h-6 text-green-400" />
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Perfect Pitch</span>
                </div>
              </div>

              {/* Code overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur p-4 border-t border-slate-800">
                <div className="flex gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <code className="text-xs text-slate-400 font-mono">
                  <span className="text-purple-400">const</span> <span className="text-blue-400">pitch</span> = <span className="text-yellow-400">await</span> ai.<span className="text-blue-300">generate</span>(visitor.<span className="text-blue-300">segment</span>);
                </code>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Visual Features Grid */}
        <section className="container mx-auto px-4 md:px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl mb-4">Not just text. <span className="text-blue-600">Intelligence.</span></h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">We replaced the static copy with a dynamic loop.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              whileHover={{ y: -5 }}
              className="group relative overflow-hidden rounded-3xl border bg-background p-8 shadow-sm hover:shadow-md transition-all"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-24 h-24" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mb-6 text-yellow-600 dark:text-yellow-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Instant Adaptation</h3>
              <p className="text-muted-foreground">
                Detects if they are new, returning, or from an ad. Changes the script in milliseconds.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="group relative overflow-hidden rounded-3xl border bg-background p-8 shadow-sm hover:shadow-md transition-all"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Mic className="w-24 h-24" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Human Voice</h3>
              <p className="text-muted-foreground">
                Powered by ElevenLabs. It breathes, pauses, and speaks with your brand&apos;s actual tone.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="group relative overflow-hidden rounded-3xl border bg-background p-8 shadow-sm hover:shadow-md transition-all"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BarChart3 className="w-24 h-24" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-6 text-green-600 dark:text-green-400">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Self-Improving</h3>
              <p className="text-muted-foreground">
                It learns what works. If a pitch doesn&apos;t convert, it rewrites itself for the next visitor.
              </p>
            </motion.div>
          </div>
        </section>

        {/* How it works - Visual Steps */}
        <section className="bg-slate-50 dark:bg-slate-900/50 py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-8">
                <h2 className="text-3xl md:text-4xl font-bold">Setup in 3 minutes.</h2>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-none w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</div>
                    <div>
                      <h4 className="font-bold text-lg">Paste your URL</h4>
                      <p className="text-muted-foreground">We scrape your site to understand your product.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-none w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">2</div>
                    <div>
                      <h4 className="font-bold text-lg">Select Segments</h4>
                      <p className="text-muted-foreground">Choose who gets a special greeting (e.g. &quot;Meta Ads&quot;).</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-none w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">3</div>
                    <div>
                      <h4 className="font-bold text-lg">Embed Widget</h4>
                      <p className="text-muted-foreground">One line of code. Works on any stack.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-xl border p-6 font-mono text-sm">
                  <div className="text-green-500 mb-2">{'<!-- Your Website -->'}</div>
                  <div className="pl-4 text-slate-400">
                    &lt;body&gt;<br />
                    &nbsp;&nbsp;...<br />
                    &nbsp;&nbsp;<span className="text-blue-500">&lt;script</span> <span className="text-purple-500">src</span>=&quot;<span className="text-yellow-600">https://pitchvoice.ai/widget.js</span>&quot;<span className="text-blue-500">&gt;&lt;/script&gt;</span><br />
                    &lt;/body&gt;
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section (Collapsed) */}
        <section className="container mx-auto px-4 md:px-6 py-24 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">Common Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Will this annoy my users?</AccordionTrigger>
              <AccordionContent>
                No. It&apos;s polite. You control if it auto-plays or waits for a click. It remembers if a user muted it. We also detect if users have accessibility settings enabled and respect those preferences.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>How does the optimization work?</AccordionTrigger>
              <AccordionContent>
                We track &quot;listen-through rate&quot; and &quot;CTA clicks&quot;. If a script underperforms, Gemini generates a new variant to test. The AI learns from successful pitches and continuously improves messaging for different visitor segments.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Can I use my own voice?</AccordionTrigger>
              <AccordionContent>
                Coming soon. For now, we use high-quality ElevenLabs voices that match your brand tone. You can choose from different voice profiles and adjust tone, speed, and emotion.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>What does it cost?</AccordionTrigger>
              <AccordionContent>
                During the hackathon beta, it&apos;s free. After launch, pricing will be based on the number of voice plays per month. Early adopters will get locked-in discount rates.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger>Does it work with my tech stack?</AccordionTrigger>
              <AccordionContent>
                Yes. PitchVoice is a simple JavaScript widget that works with any website—WordPress, Shopify, React, Vue, static HTML, or anything else. No backend changes required.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger>Can I customize what it says?</AccordionTrigger>
              <AccordionContent>
                Absolutely. You can set guidelines, talking points, and brand voice. The AI generates scripts within your parameters, or you can manually write scripts for specific segments.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-7">
              <AccordionTrigger>Will it slow down my site?</AccordionTrigger>
              <AccordionContent>
                No. The widget loads asynchronously and weighs less than 15KB. Audio is streamed on-demand, so there&apos;s zero impact on initial page load time.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-8">
              <AccordionTrigger>What about data privacy?</AccordionTrigger>
              <AccordionContent>
                We&apos;re GDPR and CCPA compliant. We only collect anonymous visitor segment data (like referral source). No personal information is stored, and all data is encrypted in transit.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-9">
              <AccordionTrigger>Does it support multiple languages?</AccordionTrigger>
              <AccordionContent>
                Not yet, but it&apos;s on our roadmap. Currently, PitchVoice works best with English content. Multi-language support with automatic translation is coming in Q1 2026.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-10">
              <AccordionTrigger>How much does it improve conversions?</AccordionTrigger>
              <AccordionContent>
                Early beta tests show 15-30% improvement in engagement for qualifying traffic. Voice creates a personal connection that text alone can&apos;t match—especially for mobile users and accessibility needs.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* CTA Footer */}
        <section id="early-access" className="py-24 text-center bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900"></div>
          <div className="container mx-auto relative z-10 px-4">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to give your site a voice?</h2>
            <p className="text-slate-300 mb-8 max-w-xl mx-auto">
              Join the limited hackathon beta. We&apos;ll help you set up your first self-optimizing pitch.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="founder@startup.com"
                className="h-12 px-4 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
              />
              <Button size="lg" className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white border-none">
                Join Waitlist
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
