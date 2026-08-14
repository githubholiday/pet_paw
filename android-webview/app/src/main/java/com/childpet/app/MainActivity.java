package com.childpet.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

public class MainActivity extends Activity {

    private WebView webView;
    private static final int FILECHOOSER_RESULTCODE = 1001;
    private ValueCallback<Uri[]> uploadMessage;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings ws = webView.getSettings();
        ws.setJavaScriptEnabled(true);        // 应用逻辑需要 JS
        ws.setDomStorageEnabled(true);        // localStorage（打卡数据存这里）
        ws.setDatabaseEnabled(true);
        ws.setAllowFileAccess(true);
        ws.setMediaPlaybackRequiresUserGesture(false);
        ws.setJavaScriptCanOpenWindowsAutomatically(true);
        // 允许 <input type="file"> 选择本地文件（导入备份需要）
        ws.setAllowFileAccessFromFileURLs(true);
        ws.setAllowUniversalAccessFromFileURLs(true);

        // 拦截链接在应用内打开，不跳浏览器
        webView.setWebViewClient(new WebViewClient());

        // 处理 JS 弹窗（alert / confirm / prompt）。
        // 不设置 WebChromeClient 时 WebView 会静默吞掉 confirm()，
        // 导致"恢复出厂设置 / 删除任务 / 删除商品"的确认框不弹出、操作无效。
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                        .setMessage(message)
                        .setPositiveButton(android.R.string.ok, (dialog, which) -> result.confirm())
                        .setOnDismissListener(dialog -> result.confirm())
                        .create()
                        .show();
                return true;
            }

            @Override
            public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                        .setMessage(message)
                        .setPositiveButton(android.R.string.ok, (dialog, which) -> result.confirm())
                        .setNegativeButton(android.R.string.cancel, (dialog, which) -> result.cancel())
                        .setOnDismissListener(dialog -> result.cancel())
                        .create()
                        .show();
                return true;
            }

            @Override
            public boolean onJsPrompt(WebView view, String url, String message, String defaultValue, JsPromptResult result) {
                final EditText input = new EditText(MainActivity.this);
                if (defaultValue != null) input.setText(defaultValue);
                new AlertDialog.Builder(MainActivity.this)
                        .setMessage(message)
                        .setView(input)
                        .setPositiveButton(android.R.string.ok, (dialog, which) -> result.confirm(input.getText().toString()))
                        .setNegativeButton(android.R.string.cancel, (dialog, which) -> result.cancel())
                        .setOnDismissListener(dialog -> result.cancel())
                        .create()
                        .show();
                return true;
            }

            // 让 <input type="file">（导入备份）能打开系统文件选择器
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                             WebChromeClient.FileChooserParams fileChooserParams) {
                uploadMessage = filePathCallback;
                try {
                    Intent intent = fileChooserParams.createIntent();
                    startActivityForResult(intent, FILECHOOSER_RESULTCODE);
                } catch (Exception e) {
                    uploadMessage = null;
                    Toast.makeText(MainActivity.this, "无法打开文件选择器", Toast.LENGTH_LONG).show();
                    return false;
                }
                return true;
            }
        });

        // 原生桥接：JS 调用 Android 把备份写到下载目录（WebView 不支持 a.download）
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");

        // 加载打包进 APK 的网站（完全离线，无需服务器 / GitHub）
        webView.loadUrl("file:///android_asset/index.html");
    }

    /** JS 导出备份时由 exportBackup() 调用，把 base64 内容写入下载目录。
     *  返回 "OK:<位置>" 或 "ERR:<原因>"，由 JS 据此弹窗，避免"假成功"。 */
    public class AndroidBridge {
        @JavascriptInterface
        public String saveFile(String fileName, String base64Content) {
            OutputStream out = null;
            try {
                byte[] data = android.util.Base64.decode(base64Content, android.util.Base64.DEFAULT);
                String location;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    // Android 10+：用 MediaStore 写公共下载目录，无需存储权限
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
                    values.put(MediaStore.Downloads.MIME_TYPE, "application/json");
                    Uri itemUri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    if (itemUri == null) throw new IOException("无法在下载目录创建文件");
                    out = getContentResolver().openOutputStream(itemUri);
                    location = "系统下载目录";
                } else {
                    // 旧系统：写应用私有下载目录（无需权限）
                    File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    if (dir != null && !dir.exists()) dir.mkdirs();
                    File file = new File(dir, fileName);
                    out = new FileOutputStream(file);
                    location = file.getAbsolutePath();
                }
                out.write(data);
                return "OK:" + location;
            } catch (Exception e) {
                return "ERR:" + (e.getMessage() != null ? e.getMessage() : e.toString());
            } finally {
                if (out != null) {
                    try { out.close(); } catch (Exception ignored) {}
                }
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILECHOOSER_RESULTCODE) {
            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK && data != null) {
                String dataString = data.getDataString();
                if (dataString != null) results = new Uri[]{ Uri.parse(dataString) };
            }
            if (uploadMessage != null) {
                uploadMessage.onReceiveValue(results);
                uploadMessage = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
