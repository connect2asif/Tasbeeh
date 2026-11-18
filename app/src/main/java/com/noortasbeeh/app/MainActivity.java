package com.noortasbeeh.app;

import android.app.Activity;
import android.content.Intent;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** Native Android shell for the bundled, entirely offline tasbeeh interface. */
public class MainActivity extends Activity {
    private WebView webView;
    private Vibrator vibrator;
    private ToneGenerator toneGenerator;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(0xFF071A29);
        getWindow().setNavigationBarColor(0xFF081B28);
        getWindow().getDecorView().setSystemUiVisibility(0);
        vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);
        toneGenerator = new ToneGenerator(AudioManager.STREAM_MUSIC, 30);
        webView = new WebView(this);
        webView.setBackgroundColor(0xFF071A29);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        // No remote content, network permission, adverts, accounts, or analytics.
        settings.setBlockNetworkLoads(true);
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return !url.startsWith("file:///android_asset/");
            }
        });
        webView.addJavascriptInterface(new NativeBridge(), "Android");
        setContentView(webView);
        webView.loadUrl("file:///android_asset/index.html");
    }

    public class NativeBridge {
        /** Dim the Android system bars too, without changing saved app preferences. */
        @JavascriptInterface public void setNightChrome(boolean enabled) {
            runOnUiThread(() -> {
                if (getWindow() != null) {
                    getWindow().setStatusBarColor(enabled ? 0xFF000000 : 0xFF071A29);
                    getWindow().setNavigationBarColor(enabled ? 0xFF000000 : 0xFF081B28);
                }
            });
        }
        @JavascriptInterface public void feedback(boolean sound, boolean vibration) {
            if (vibration) vibrate(22);
            if (sound) {
                runOnUiThread(() -> {
                    if (toneGenerator != null) toneGenerator.startTone(ToneGenerator.TONE_PROP_BEEP, 45);
                });
            }
        }
        @JavascriptInterface public void goalFeedback() {
            runOnUiThread(() -> {
                if (vibrator != null && vibrator.hasVibrator()) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                        vibrator.vibrate(VibrationEffect.createWaveform(new long[]{0,75,65,130}, -1));
                    else vibrator.vibrate(new long[]{0,75,65,130}, -1);
                }
            });
        }
        @JavascriptInterface public void shareBackup(String backupJson) {
            runOnUiThread(() -> {
                Intent share = new Intent(Intent.ACTION_SEND);
                share.setType("text/plain");
                share.putExtra(Intent.EXTRA_SUBJECT, "Noor Tasbeeh backup");
                share.putExtra(Intent.EXTRA_TEXT, backupJson);
                startActivity(Intent.createChooser(share, "Save or share Tasbeeh backup"));
            });
        }
    }

    private void vibrate(long durationMs) {
        runOnUiThread(() -> {
            if (vibrator == null || !vibrator.hasVibrator()) return;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                vibrator.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE));
            else vibrator.vibrate(durationMs);
        });
    }

    @Override public void onBackPressed() {
        if (webView == null) { super.onBackPressed(); return; }
        webView.evaluateJavascript("window.appBack()", value -> {
            if (!"true".equals(value)) MainActivity.super.onBackPressed();
        });
    }

    @Override protected void onDestroy() {
        if (toneGenerator != null) { toneGenerator.release(); toneGenerator = null; }
        if (webView != null) { webView.destroy(); webView = null; }
        super.onDestroy();
    }
}
