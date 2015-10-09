package com.cradle.iitc_mobile.async;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.os.AsyncTask;

import com.cradle.iitc_mobile.IITC_Mobile;
import com.cradle.iitc_mobile.Log;

import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;

import java.io.IOException;

/*
 * this class parses the http response of a web page.
 * since network operations shouldn't be done on main UI thread
 * (NetworkOnMainThread exception is thrown) we use an async task for this.
 */
public class CheckHttpResponse extends AsyncTask<String, Void, Boolean> {

    private final IITC_Mobile mIitc;

    public CheckHttpResponse(final IITC_Mobile iitc) {
        mIitc = iitc;
    }

    @Override
    protected Boolean doInBackground(final String... urls) {
        // check http responses and disable splash screen on error
        HttpGet httpRequest = null;
        try {
            httpRequest = new HttpGet(urls[0]);
        } catch (final IllegalArgumentException e) {
            Log.w(e);
            return false;
        }
        final HttpClient httpclient = new DefaultHttpClient();
        HttpResponse response = null;
        try {
            response = httpclient.execute(httpRequest);
            final int code = response.getStatusLine().getStatusCode();
            if (code != HttpStatus.SC_OK) {
                Log.d("received error code: " + code);
                mIitc.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        mIitc.setLoadingState(false);
                    }
                });
                // TODO: remove when google login issue is fixed
                if (urls[0].contains("uberauth=WILL_NOT_SIGN_IN")) { return true; }
            }
        } catch (final IOException e) {
            Log.w(e);
        }
        return false;
    }

    /*
     * TEMPORARY WORKAROUND for Google login fail
     */
    @Override
    protected void onPostExecute(final Boolean aBoolean) {
        if (aBoolean) {
            Log.d("google auth error, redirecting to work-around page");
            final AlertDialog.Builder alertDialogBuilder = new AlertDialog.Builder(mIitc);

            // set title
            alertDialogBuilder.setTitle("登入失敗!");

            // set dialog message
            alertDialogBuilder
                    .setMessage("這個問題是由Google造成的，希望盡快解決. " +
                            "要解決這個問題:\n" +
                            "• 在選擇帳戶時選擇 '取消' " +
                            "並手動輸入您的電子郵件地址和密碼進入網頁\n" +
                            "• 如果您沒有看到帳戶選擇, 請清除應用程序快取和資料" +
                            "強迫應用程式重新登入")
                    .setCancelable(true)
                    .setNeutralButton("Reload now", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(final DialogInterface dialog, final int which) {
                            dialog.cancel();
                            mIitc.reloadIITC();
                        }
                    });

            // create alert dialog
            final AlertDialog alertDialog = alertDialogBuilder.create();

            // show it
            alertDialog.show();
        }
    }
}
