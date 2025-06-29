export interface UIState {
  selectedMenuItem: string | null;
  modalOpen: boolean;
  currentView: 'main' | 'menu' | 'marketing' | 'operations';
  animationsEnabled: boolean;
  soundEnabled: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}

export interface CustomerSprite {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  satisfaction: number;
  orderTime: number;
  state: 'entering' | 'ordering' | 'eating' | 'leaving';
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  duration: number;
  timestamp: number;
}

export interface AnimationFrame {
  timestamp: number;
  deltaTime: number;
  fps: number;
}