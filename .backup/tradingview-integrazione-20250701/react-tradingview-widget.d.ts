declare module 'react-tradingview-widget' {
  import * as React from 'react';
  interface TradingViewWidgetProps {
    symbol?: string;
    theme?: 'light' | 'dark';
    width?: string | number;
    height?: string | number;
    interval?: string;
    style?: string | number;
    locale?: string;
    autosize?: boolean;
    allow_symbol_change?: boolean;
    enable_publishing?: boolean;
    save_image?: boolean;
    hide_top_toolbar?: boolean;
    hide_side_toolbar?: boolean;
    toolbar_bg?: string;
    container_id?: string;
    [key: string]: any;
  }
  const TradingViewWidget: React.FC<TradingViewWidgetProps>;
  export default TradingViewWidget;
}
