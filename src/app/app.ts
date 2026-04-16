import {ChangeDetectionStrategy, Component, OnInit, signal, inject, PLATFORM_ID, afterNextRender, effect} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import {animate, stagger} from 'motion';

import { uploadFile } from '@uploadcare/upload-client';

interface Role {
  id: string;
  shortTitle: string;
  title: string;
  description: string;
  responsibilities: string[];
  experience: string[];
  note: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private platformId = inject(PLATFORM_ID);
  currentTime = signal(new Date().toLocaleTimeString('en-US', { hour12: false }));
  
  isModalOpen = signal(false);
  selectedRole = signal<Role | null>(null);
  
  manifestoWords = signal<string[]>([]);
  
  isSubmitting = signal(false);
  cvStatus = signal<'idle' | 'uploading' | 'success' | 'error'>('idle');
  portfolioStatus = signal<'idle' | 'uploading' | 'success' | 'error'>('idle');
  cvName = signal('');
  portfolioName = signal('');
  cvId = signal('');
  portfolioId = signal('');
  showSuccessModal = signal(false);

  // Form field signals for persistence
  firstName = signal('');
  lastName = signal('');
  email = signal('');
  phone = signal('');
  instagram = signal('');
  linkedin = signal('');
  additionalInfo = signal('');
  eventsWorked = signal('');
  experienceDraft = signal<Record<string, boolean>>({});

  roles: Role[] = [
    {
      id: '01',
      shortTitle: 'EVENT PROJECT MANAGER',
      title: 'Event Project Manager',
      description: "Drive end-to-end event experiences that leave lasting impressions. You'll own the lifecycle of every project — from concept to execution — with full creative and operational authority.",
      responsibilities: [
        'Plan, coordinate & execute events from ground up',
        'Manage vendor relationships, logistics & timelines',
        'Oversee on-ground operations & team delegation',
        'Ensure seamless client experience at every touchpoint',
        'Post-event reporting and performance evaluation'
      ],
      experience: [
        'Community Events',
        'College / Campus Fests',
        'Local Venue Setups',
        'Freelance Projects',
        'Self-Initiated Work',
        'NGO / Society Events'
      ],
      note: '✦ No corporate background required — real on-ground hustle matters more to us than a big company name on your CV.'
    },
    {
      id: '02',
      shortTitle: 'CRM',
      title: 'Client Relationship Management',
      description: "Be the bridge between AZFrequency and the clients who trust us. Your ability to build rapport, communicate value and retain business will directly shape the organization's growth.",
      responsibilities: [
        'Develop & maintain long-term client partnerships',
        'Act as primary point of contact for all client needs',
        'Identify upsell opportunities and new project scopes',
        'Resolve concerns with professionalism and urgency',
        'Track client satisfaction and gather actionable feedback'
      ],
      experience: [
        'Freelance Client Work',
        'Sales / Cold Outreach',
        'Small Business Support',
        'Startup Assistance',
        'Community Coordination',
        'Social Media Mgmt'
      ],
      note: '✦ We value genuine client-handling experience over prestigious titles — if you\'ve built real relationships, you belong here.'
    },
    {
      id: '03',
      shortTitle: 'VISUAL ARTIST',
      title: 'Visual Artist',
      description: "Shape the visual identity of AZFrequency and everything we create. From event branding to social content, your eye for design will define how the world sees us — and our clients.",
      responsibilities: [
        'Design graphics for events, campaigns & social media',
        'Develop cohesive visual identities for client projects',
        'Create promotional materials — digital & print-ready',
        'Collaborate with the event & client teams on briefs',
        'Maintain consistency across all visual touchpoints'
      ],
      experience: [
        'Freelance Design Work',
        'Personal Portfolio',
        'Event Poster / Flyer Design',
        'Social Media Creatives',
        'Branding Projects',
        'University Club Designs'
      ],
      note: '✦ Agency experience not needed — a strong portfolio of real, self-driven creative work speaks louder than any job title.'
    }
  ];

  constructor() {
    afterNextRender(() => {
      this.initAnimations();
      this.loadDraft();
    });

    // Automatically save draft whenever relevant signals change
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        const draft = {
          roleId: this.selectedRole()?.id,
          firstName: this.firstName(),
          lastName: this.lastName(),
          email: this.email(),
          phone: this.phone(),
          instagram: this.instagram(),
          linkedin: this.linkedin(),
          additionalInfo: this.additionalInfo(),
          eventsWorked: this.eventsWorked(),
          cvId: this.cvId(),
          cvName: this.cvName(),
          cvStatus: this.cvStatus(),
          portfolioId: this.portfolioId(),
          portfolioName: this.portfolioName(),
          portfolioStatus: this.portfolioStatus(),
          isModalOpen: this.isModalOpen(),
          experienceDraft: this.experienceDraft()
        };
        localStorage.setItem('azf_application_draft', JSON.stringify(draft));
      }
    });
  }

  private loadDraft() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('azf_application_draft');
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          if (draft.roleId) {
            const role = this.roles.find(r => r.id === draft.roleId);
            if (role) this.selectedRole.set(role);
          }
          this.firstName.set(draft.firstName || '');
          this.lastName.set(draft.lastName || '');
          this.email.set(draft.email || '');
          this.phone.set(draft.phone || '');
          this.instagram.set(draft.instagram || '');
          this.linkedin.set(draft.linkedin || '');
          this.additionalInfo.set(draft.additionalInfo || '');
          this.eventsWorked.set(draft.eventsWorked || '');
          this.cvId.set(draft.cvId || '');
          this.cvName.set(draft.cvName || '');
          this.cvStatus.set(draft.cvStatus || 'idle');
          this.portfolioId.set(draft.portfolioId || '');
          this.portfolioName.set(draft.portfolioName || '');
          this.portfolioStatus.set(draft.portfolioStatus || 'idle');
          this.experienceDraft.set(draft.experienceDraft || {});
          
          if (draft.isModalOpen) {
            this.isModalOpen.set(true);
          }
        } catch (e) {
          console.error('Failed to load draft', e);
        }
      }
    }
  }

  private clearDraft() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('azf_application_draft');
      this.firstName.set('');
      this.lastName.set('');
      this.email.set('');
      this.phone.set('');
      this.instagram.set('');
      this.linkedin.set('');
      this.additionalInfo.set('');
      this.eventsWorked.set('');
      this.cvId.set('');
      this.cvName.set('');
      this.cvStatus.set('idle');
      this.portfolioId.set('');
      this.portfolioName.set('');
      this.portfolioStatus.set('idle');
      this.experienceDraft.set({});
    }
  }

  onInputChange(event: Event, field: 'first' | 'last' | 'email' | 'phone' | 'insta' | 'note' | 'linkedin' | 'events') {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    switch(field) {
      case 'first': this.firstName.set(value); break;
      case 'last': this.lastName.set(value); break;
      case 'email': this.email.set(value); break;
      case 'phone': this.phone.set(value); break;
      case 'insta': this.instagram.set(value); break;
      case 'linkedin': this.linkedin.set(value); break;
      case 'note': this.additionalInfo.set(value); break;
      case 'events': this.eventsWorked.set(value); break;
    }
  }

  toggleExperience(item: string) {
    const current = { ...this.experienceDraft() };
    current[item] = !current[item];
    this.experienceDraft.set(current);
  }

  isExperienceChecked(item: string): boolean {
    return !!this.experienceDraft()[item];
  }

  ngOnInit() {
    this.manifestoWords.set(`AZ Frequency is a premier event architecture and cultural organization agency based in Dhaka, specializing in the engineering of high-visibility, multi-format experiences. We reject the conventional "decorator" model in favor of a structural, A–Z mandate that prioritizes technical purity, spatial discipline, and a refined industrial aesthetic. Our agency serves a sophisticated demographic of innovators and influencers who demand more than a gathering—they require a total sensory transformation. By integrating modern-morphic design, high-fidelity audio engineering, and surgical logistics, we create environments that feel both massive and meticulously curated. From monolithic concert productions and underground electronic raves to avant-garde fashion showcases and premium marketplaces, AZ Frequency operates as a strategic partner for those looking to set a new global benchmark in Bangladesh. Every project is executed with a zero-error mandate, utilizing industrial-scale staging and synchronized digital sequences to ensure an immersive journey from the first conceptual blueprint to the final frequency. We do not just plan events; we architect legacies, providing our affluent clientele and brand partners with a legally protected, trademarked standard of excellence that redefines the intersection of heritage and future-tech.`.split(/\s+/));

    if (isPlatformBrowser(this.platformId)) {
      setInterval(() => {
        this.currentTime.set(new Date().toLocaleTimeString('en-US', { hour12: false }));
      }, 1000);
    }
  }

  scrollToJoin() {
    const element = document.getElementById('join-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  openApplication(role: Role) {
    this.selectedRole.set(role);
    this.isModalOpen.set(true);
    
    // Animate modal entrance
    setTimeout(() => {
      animate(
        '.modal-panel',
        { opacity: [0, 1] },
        { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
      );
    }, 0);
  }

  closeModal() {
    animate(
      '.modal-panel',
      { opacity: 0 },
      { duration: 0.4, ease: 'easeIn' }
    ).then(() => {
      this.isModalOpen.set(false);
    });
  }

  async onFileChange(event: Event, type: 'cv' | 'portfolio') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const statusSignal = type === 'cv' ? this.cvStatus : this.portfolioStatus;
    const nameSignal = type === 'cv' ? this.cvName : this.portfolioName;
    const idSignal = type === 'cv' ? this.cvId : this.portfolioId;

    statusSignal.set('uploading');
    nameSignal.set(file.name);

    try {
      const result = await uploadFile(file, {
        publicKey: '43dbd157cf346ec35ba7',
        store: 'auto',
      });

      console.log('Uploadcare SUCCESS:', result.uuid);
      statusSignal.set('success');
      // Store the direct CDN link or UUID
      idSignal.set(`https://ucarecdn.com/${result.uuid}/`);
    } catch (error) {
      console.error('Uploadcare error:', error);
      statusSignal.set('error');
    }
  }

  async submitApplication(event: Event) {
    event.preventDefault();
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Add the asset links/data to the submission
    formData.append('cv_link', this.cvId());
    formData.append('portfolio_link', this.portfolioId());
    formData.append('linkedin_profile', this.linkedin());
    formData.append('events_worked_history', this.eventsWorked());
    formData.append('applied_role', this.selectedRole()?.title || '');
    formData.append('_subject', `New Application: ${this.selectedRole()?.title}`);

    try {
      // Submit to FormSpark
      const response = await fetch('https://submit-form.com/xhGmttc4E', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(Object.fromEntries(formData)),
      });

      if (response.ok) {
        console.log('Application submitted successfully to FormSpark');
        this.clearDraft();
        this.isModalOpen.set(false);
        this.showSuccessModal.set(true);
        
        // Auto-close success modal after some time or keep it for the user to read
        // For now, let's keep it until they close it
      } else {
        console.error('FormSpark submission failed');
        alert('Submission failed. Please try again.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private initAnimations() {
    // Hero text animation
    const heroTitle = document.querySelector('.hero-title-text');
    if (heroTitle) {
      animate(
        heroTitle,
        { opacity: [0, 1], y: [40, 0] },
        { duration: 1.2, ease: [0.22, 1, 0.36, 1] }
      );
    }

    // Staggered entrance for boxes
    const roleBoxes = document.querySelectorAll('.role-box-main');
    if (roleBoxes.length > 0) {
      animate(
        roleBoxes,
        { opacity: [0, 1], y: [20, 0] },
        { delay: stagger(0.2), duration: 0.8, ease: 'easeOut' }
      );
    }

    // Manifesto scroll observer
    const words = document.querySelectorAll('.word');
    if (words.length > 0) {
      const observerOptions = {
        root: null,
        threshold: 0,
        rootMargin: '-10% 0px -20% 0px'
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          } else {
            // Reverse color logic: remove 'active' when scrolling back up
            // only if the item leaves the threshold
            entry.target.classList.remove('active');
          }
        });
      }, observerOptions);

      words.forEach(word => observer.observe(word));
    }
  }
}
