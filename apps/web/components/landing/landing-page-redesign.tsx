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
import { ArrowRight, Mic, Volume2, Sparkles, MessageCircle, Zap } from 'lucide-react';
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

export default function LandingPageRedesign() {
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
            <span>Voice Hero</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Dashboard
            </Link>
            <a href="https://github.com/esatemre/voice-hero" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-primary transition-colors">
              GitHub
            </a>
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
                🧪 Hackathon Experiment | Google Cloud x ElevenLabs
              </Badge>
            </motion.div>

            <motion.h1 variants={item} className="max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl mb-6">
              What if your website <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600">
                could talk?
              </span>
            </motion.h1>

            <motion.p variants={item} className="max-w-2xl text-lg text-muted-foreground mb-10 leading-relaxed sm:text-xl">
              A humble exploration of voice as a way to add personality, curiosity, and engagement to websites. Because sometimes people want to listen, not just read.
            </motion.p>

            <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="#early-access">
                <Button size="lg" className="h-12 px-8 rounded-full text-base w-full sm:w-auto shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all">
                  Get Early Access <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo.html" target="_blank">
                <Button variant="outline" size="lg" className="h-12 px-8 rounded-full text-base w-full sm:w-auto backdrop-blur-sm bg-background/50">
                  <Volume2 className="mr-2 h-4 w-4" /> See It In Action
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Why Voice? Section */}
        <section className="container mx-auto px-4 md:px-6 py-16 max-w-3xl">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="space-y-6"
          >
            <motion.h2 variants={item} className="text-3xl font-bold text-center mb-8">Why Voice?</motion.h2>
            
            <motion.div variants={item} className="space-y-4 text-muted-foreground">
              <p className="text-lg">
                The web is changing. We're entering an era where voice interactions feel natural, not gimmicky. Voice creates connection in ways text can't.
              </p>
              <p className="text-lg">
                Voice <strong className="text-foreground">invites curiosity</strong>. When visitors see that your site has audio, they'll click play. They want to listen.
              </p>
              <p className="text-lg">
                Voice <strong className="text-foreground">adds personality</strong>. Your brand gets a literal voice—share announcements, tell stories, create moments that matter.
              </p>
              <p className="text-lg">
                Voice <strong className="text-foreground">benefits everyone</strong>. It's not just accessibility (though that matters). It's for people who prefer listening, multitasking, or simply exploring differently.
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/* What You Can Do Section */}
        <section className="bg-slate-50 dark:bg-slate-900/50 py-24">
          <div className="container mx-auto px-4 md:px-6">
            <motion.h2 
              variants={item}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="text-3xl font-bold text-center mb-16"
            >
              What You Can Do
            </motion.h2>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                whileHover={{ y: -5 }}
                className="group relative overflow-hidden rounded-3xl border bg-background p-8 shadow-sm hover:shadow-md transition-all"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles className="w-24 h-24" />
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-6 text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Add Personality</h3>
                <p className="text-muted-foreground">
                  Give your brand a literal voice. Let your site speak to visitors in your authentic tone.
                </p>
              </motion.div>

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
                <h3 className="text-xl font-bold mb-2">Invite Interaction</h3>
                <p className="text-muted-foreground">
                  People are curious. If they see your site has voice, they'll listen. It's that simple.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="group relative overflow-hidden rounded-3xl border bg-background p-8 shadow-sm hover:shadow-md transition-all"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <MessageCircle className="w-24 h-24" />
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Real-Time Announcements</h3>
                <p className="text-muted-foreground">
                  Share updates, promotions, or news while visitors browse. Voice creates urgency that text doesn't.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="group relative overflow-hidden rounded-3xl border bg-background p-8 shadow-sm hover:shadow-md transition-all"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Volume2 className="w-24 h-24" />
                </div>
                <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-6 text-green-600 dark:text-green-400">
                  <Volume2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Accessibility & More</h3>
                <p className="text-muted-foreground">
                  Benefits everyone who wants to listen. Accessibility is a feature, not an afterthought.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="container mx-auto px-4 md:px-6 py-24">
          <motion.h2 
            variants={item}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-16"
          >
            Some Possibilities
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              whileHover={{ y: -5 }}
              className="border rounded-2xl p-6 hover:shadow-md transition-all"
            >
              <h3 className="text-xl font-bold mb-3">E-Commerce</h3>
              <p className="text-muted-foreground">
                Tell the story of your products while customers browse. Let them hear about what makes you different.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="border rounded-2xl p-6 hover:shadow-md transition-all"
            >
              <h3 className="text-xl font-bold mb-3">SaaS & Tools</h3>
              <p className="text-muted-foreground">
                Guide users through features with your brand's voice. Show, don't just tell.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="border rounded-2xl p-6 hover:shadow-md transition-all"
            >
              <h3 className="text-xl font-bold mb-3">Announcements</h3>
              <p className="text-muted-foreground">
                Share updates, promotions, or breaking news as users land on your site. Make announcements feel personal.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="border rounded-2xl p-6 hover:shadow-md transition-all"
            >
              <h3 className="text-xl font-bold mb-3">Storytelling</h3>
              <p className="text-muted-foreground">
                Create narrative experiences that text alone can't match. Let your voice carry the message.
              </p>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-slate-50 dark:bg-slate-900/50 py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row items-center gap-12 max-w-5xl mx-auto">
              <div className="flex-1 space-y-8">
                <motion.h2 
                  variants={item}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className="text-3xl md:text-4xl font-bold"
                >
                  How It Works
                </motion.h2>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-none w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">1</div>
                    <div>
                      <h4 className="font-bold text-lg">Connect your website</h4>
                      <p className="text-muted-foreground">Paste your URL and we'll understand your product.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-none w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">2</div>
                    <div>
                      <h4 className="font-bold text-lg">Write or generate scripts</h4>
                      <p className="text-muted-foreground">Use AI to generate or craft your own scripts.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-none w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">3</div>
                    <div>
                      <h4 className="font-bold text-lg">Choose a voice</h4>
                      <p className="text-muted-foreground">Pick from 500+ realistic voices from ElevenLabs.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-none w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">4</div>
                    <div>
                      <h4 className="font-bold text-lg">Embed one line of code</h4>
                      <p className="text-muted-foreground">Copy-paste into your site. Works on any stack.</p>
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
                    &nbsp;&nbsp;<span className="text-blue-500">&lt;script</span> <span className="text-purple-500">src</span>=&quot;<span className="text-yellow-600">https://voicehero.prodfact.com/widget.js</span>&quot;<span className="text-blue-500">&gt;&lt;/script&gt;</span><br />
                    &lt;/body&gt;
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 md:px-6 py-24 max-w-3xl">
          <motion.h2 
            variants={item}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-12"
          >
            Questions?
          </motion.h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Will this annoy my users?</AccordionTrigger>
              <AccordionContent>
                No. Audio is optional, never forced. You control autoplay settings. Users can mute it anytime. We respect accessibility preferences and user choice.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>How does script generation work?</AccordionTrigger>
              <AccordionContent>
                We use Google Gemini to understand your page content and generate engaging scripts. You can customize the tone, length, and message. Or write your own.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>What can I say?</AccordionTrigger>
              <AccordionContent>
                Anything you want. Set your own guidelines and talking points, or let the AI generate within your parameters. You're in control.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Does it cost anything?</AccordionTrigger>
              <AccordionContent>
                During the hackathon beta, it's free. We're exploring pricing models post-launch, but early adopters will get special rates.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger>What tech powers this?</AccordionTrigger>
              <AccordionContent>
                Built on Next.js, Google Vertex AI (Gemini), ElevenLabs for voices, and Firebase for data. It's open source on GitHub.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger>Is this a real product?</AccordionTrigger>
              <AccordionContent>
                Yes and no. It's a real, working product right now. But we're exploring ideas, so consider it experimental. Things may change.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-7">
              <AccordionTrigger>Will it slow down my site?</AccordionTrigger>
              <AccordionContent>
                No. The widget loads asynchronously and is less than 15KB. Audio streams on-demand. Zero impact on page load performance.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-8">
              <AccordionTrigger>What about privacy?</AccordionTrigger>
              <AccordionContent>
                GDPR and CCPA compliant. We only track anonymous visitor segments (like referral source). No personal data stored. All data encrypted.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Footer CTA */}
        <section id="early-access" className="py-24 text-center bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900"></div>
          <div className="container mx-auto relative z-10 px-4">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Want to try it?</h2>
            <p className="text-slate-300 mb-8 max-w-xl mx-auto">
              Join the hackathon beta. We'll help you give your website a voice.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="you@example.com"
                className="h-12 px-4 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
              />
              <Button size="lg" className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white border-none">
                Join
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800">
        <div className="container mx-auto px-4 md:px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-white mb-4">Voice Hero</h3>
              <p className="text-sm">A hackathon experiment exploring voice as a way to create more engaging, personal websites.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a>
                </li>
                <li>
                  <a href="https://github.com/esatemre/voice-hero" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Powered By</h4>
              <ul className="space-y-2 text-sm">
                <li>Next.js</li>
                <li>Google Vertex AI (Gemini)</li>
                <li>ElevenLabs</li>
                <li>Firebase</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Hackathon</h4>
              <p className="text-sm">Google Cloud x ElevenLabs 2025</p>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-sm text-center">
            <p>Built with ❤️ for the Google Cloud x ElevenLabs Hackathon 2025</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
