package com.sigae.escolar;

import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onBackPressed() {
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();
            String url = webView.getUrl();
            if (url != null && (url.endsWith("/") || url.endsWith("/#/") || url.endsWith("index.html") || !webView.canGoBack())) {
                moveTaskToBack(true);
                return;
            }
        }
        super.onBackPressed();
    }
}
