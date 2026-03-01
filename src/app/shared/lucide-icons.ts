/**
 * Shared Lucide icon set for the SmartHire application (front-office + back-office).
 *
 * Import `LUCIDE_ICONS` in any standalone component's `imports` array.
 *
 * Usage in templates:  <lucide-icon name="search" [size]="16"></lucide-icon>
 */
import { NgModule } from '@angular/core';
import {
  LucideAngularModule,
  LucideAngularComponent,
  LucideIconProvider,
  LUCIDE_ICONS as LUCIDE_ICONS_TOKEN,
  Activity,
  Archive,
  ArrowLeft,
  ArrowRight,
  Bell,
  Bookmark,
  BookOpen,
  BrainCircuit,
  Briefcase,
  Calendar,
  ChartBar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleCheck,
  CirclePlay,
  CircleQuestionMark,
  CircleX,
  Clock,
  Code,
  Cpu,
  CreditCard,
  Database,
  DollarSign,
  Download,
  EllipsisVertical,
  Eye,
  EyeOff,
  File,
  FileText,
  Film,
  Flag,
  Folder,
  Github,
  Globe,
  GraduationCap,
  Grid2x2,
  HardDrive,
  Image,
  Info,
  Layers,
  LayoutGrid,
  Lightbulb,
  Link,
  Linkedin,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Send,
  Server,
  Settings,
  Shield,
  ShieldCheck,
  SquarePen,
  Star,
  StarHalf,
  TrendingDown,
  TrendingUp,
  Trash2,
  TriangleAlert,
  Twitter,
  Upload,
  User,
  Users,
  X,
  Zap,
} from 'lucide-angular';

const icons = {
  Activity, Archive, ArrowLeft, ArrowRight, Bell, Bookmark, BookOpen,
  BrainCircuit, Briefcase, Calendar, ChartBar, Check, ChevronDown, ChevronLeft,
  ChevronRight, ChevronUp, CircleCheck, CirclePlay, CircleQuestionMark, CircleX,
  Clock, Code, Cpu, CreditCard, Database, DollarSign, Download, EllipsisVertical,
  Eye, EyeOff, File, FileText, Film, Flag, Folder, Github, Globe, GraduationCap,
  Grid2x2, HardDrive, Image, Info, Layers, LayoutGrid, Lightbulb, Link, Linkedin,
  Lock, LogOut, Mail, MapPin, MessageSquare, Play, Plus, Radio, RefreshCw, Search,
  Send, Server, Settings, Shield, ShieldCheck, SquarePen, Star, StarHalf,
  TrendingDown, TrendingUp, Trash2, TriangleAlert, Twitter, Upload, User, Users,
  X, Zap,
};

/**
 * Wrapper NgModule that registers Lucide icons and re-exports the
 * LucideAngularComponent.  Standalone components import this class
 * instead of using LucideAngularModule.pick() (which returns
 * ModuleWithProviders — rejected by Angular 18 standalone imports).
 */
@NgModule({
  imports:    [LucideAngularModule],
  exports:    [LucideAngularModule],
  providers:  [
    { provide: LUCIDE_ICONS_TOKEN, multi: true, useValue: new LucideIconProvider(icons) },
  ],
})
export class LUCIDE_ICONS {}
