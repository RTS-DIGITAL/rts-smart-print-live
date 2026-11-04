import { supabase } from '@/lib/supabase';
import type { PrintService } from '@/lib/types';
import { createLiveService } from '@/services/liveService';
import { demoService } from '@/services/demoService';

export const printService: PrintService = supabase ? createLiveService(supabase) : demoService;
