/*! 20240828181423453
* Dynamsoft JavaScript Library
* Product: Dynamic Web TWAIN
* Web Site: https://www.dynamsoft.com
*
* Copyright 2025, Dynamsoft Corporation
* Author: Dynamsoft Support Team
* Version: 19.0
*/

//Dynamsoft.On{actionName} It is a callback function called by Web-TWAIN product. The contents of this function are the default templates of the WebTWAIN. Users can modify the fucntions, but be aware that the function name itself cannot be modified
//Dynamsoft._{functionName} It is a private function used by Dynamsoft.On{actionName}. Users can modify and delete according to their needs.
(function () {
  "use strict";
  var promptDlgWidth = 620;

  if(Dynamsoft.navInfoSync.bMobile) {
    if(screen.width<620) {
      promptDlgWidth = screen.width - 10;
    }
  }

  //----------------------start Install Dialog---------------------------

  //Web TWAIN Service is not detected dialogs
  //Windows
  Dynamsoft.OnWebTwainNotFoundOnWindowsCallback = function (ProductName, InstallerUrl, bHTML5, bIE, bSafari, bSSL, strIEVersion) {
    var _this = Dynamsoft,
      objUrl = {
        'default': InstallerUrl
      };
    _this._show_install_dialog(ProductName, objUrl, bHTML5, Dynamsoft.DWT.EnumDWT_PlatformType.enumWindow, bIE, bSafari, bSSL, strIEVersion, false);
  };

  //Linux
  Dynamsoft.OnWebTwainNotFoundOnLinuxCallback = function (ProductName, strDebUrl, strRpmUrl, bHTML5, bIE, bSafari, bSSL, strIEVersion, iPlatform) {
    var _this = Dynamsoft,
      objUrl = {
        'default': strDebUrl,
        'deb': strDebUrl,
        'rpm': strRpmUrl
      };
    if (!iPlatform) iPlatform = Dynamsoft.DWT.EnumDWT_PlatformType.enumLinux;
    _this._show_install_dialog(ProductName, objUrl, bHTML5, iPlatform, bIE, bSafari, bSSL, strIEVersion, false);
  };

  //MacOS
  Dynamsoft.OnWebTwainNotFoundOnMacCallback = function (ProductName, InstallerUrl, bHTML5, bIE, bSafari, bSSL, strIEVersion) {
    var _this = Dynamsoft,
      objUrl = {
        'default': InstallerUrl
      };
    _this._show_install_dialog(ProductName, objUrl, bHTML5, Dynamsoft.DWT.EnumDWT_PlatformType.enumMac, bIE, bSafari, bSSL, strIEVersion, false);
  };

  //Android
  Dynamsoft.OnWebTwainNotFoundOnAndroidCallback = function (ProductName, InstallerUrl, bSSL, bUpgrade) {
    var ObjString = "Starting from version 19.0, Android platform is no longer supported.";

    Dynamsoft.DWT.ShowMessage(ObjString, {
      width: 480,
      headerStyle: 2
    });
  };

  //Web TWAIN Service is not supported dialogs
  //Mobile Browsers
  Dynamsoft.OnMobileNotSupportCallback = function () {
    var ObjString = [];

    if (Dynamsoft.DWT) {

      ObjString.push('<div class="ds-dwt-ui-dlg-android" style="padding-bottom:30px">');
      ObjString.push('Service Mode does not support your Operating System, please contact the site administrator.');
      ObjString.push('</div>');

      Dynamsoft.DWT.ShowMessage(ObjString.join(''), {
        width: 335,
        headerStyle: 1,
        backgroundStyle: 1
      });
    } else {
      console.log("The Dynamsoft namespace is missing");
    }

  };

  //Error Message - HTTPS is required to allow CORS to function. This error appears when HTTP is detected. (See: https://www.dynamsoft.com/web-twain/docs/faq/http-insecure-websites-in-chromium-browser.html?ver=latest)
  Dynamsoft.OnHTTPCorsError = function (msg) {

    var ObjString = [
      "<div>", msg, "</div>",
      '<div style="margin-top:10px">To fix the issue, please update your website to HTTPS or refer to <br /><a target="_blank" href="https://www.dynamsoft.com/web-twain/docs/faq/http-insecure-websites-in-chromium-browser.html?ver=latest">this article</a> for other workarounds.</div>'
    ].join('');

    Dynamsoft.DWT.ShowMessage(ObjString, {
      width: promptDlgWidth,
      headerStyle: 2
    });
  };

  Dynamsoft._show_install_dialog = function (ProductName, objInstallerUrl, bHTML5, iPlatform, bIE, bSafari, bSSL, strIEVersion, bNeedUpgrade) {
    var _this = Dynamsoft,
      ObjString, title, browserActionNeeded,
      EnumPlatform = Dynamsoft.DWT.EnumDWT_PlatformType,
      bUnix = (iPlatform == EnumPlatform.enumLinux || iPlatform == EnumPlatform.enumEmbed ||
        iPlatform == EnumPlatform.enumChromeOS || iPlatform == EnumPlatform.enumHarmonyOS),
      imagesInBase64 = {
        icn_download: 'data:image/png;base64,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',
        icn_install: 'data:image/png;base64,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',
        icn_scan: 'data:image/png;base64,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'
      };

    // npm file mode
    if (bNeedUpgrade)
      title = 'Please update your document scanning service'; //'Please follow the steps below to upgrade your local document scanning service.';
    else
      title = 'Please download and install the Dynamic Web TWAIN service';
    ObjString = [
      '<div class="dynamsoft-dwt-dlg-title">',
      title,
      '</div><div class="dynamsoft-dwt-dlg-title-error" style="display:none"></div>'
    ];

    if (_this.DWT) {

      var bFirefox = Dynamsoft.navInfoSync.bFirefox;
      if (bUnix || bFirefox) {
        browserActionNeeded = 'RESTART';
      } else {
        browserActionNeeded = 'REFRESH';
      }
      ObjString.push('<div class="dynamsoft-dwt-installdlg-iconholder"> ');

      var left = '134px';

      ObjString.push('<div class="dynamsoft-dwt-installdlg-splitline" style="left: ' + left + '"></div>');

      ObjString.push('<div class="dynamsoft-dwt-installdlg-splitline" style="left: 328px"></div>');

      var marginRight = '133px';

      ObjString.push('<img style="margin: 0px ' + marginRight + ' 0px 0px" src="' + imagesInBase64.icn_download + '" alt="download" />');
      ObjString.push('<img style="margin: 2px ' + marginRight + ' 2px 0px" src="' + imagesInBase64.icn_install + '" alt="install" />');
      ObjString.push('<img src="' + imagesInBase64.icn_scan + '" alt="scan" />');
      ObjString.push('<div><span class="dynamsoft-dwt-installdlg-text" style="right: 160px">Download</span>');
      ObjString.push('<span class="dynamsoft-dwt-installdlg-text" style="right: 18px">Install</span>');
      ObjString.push('<span class="dynamsoft-dwt-installdlg-text" style="left: 140px">Scan</span>');
      ObjString.push('</div>');
      ObjString.push('</div>');

      if (bHTML5 && bUnix) {
        ObjString.push('<div style="margin:10px 0 0 60px;">');
        ObjString.push('<div id="dwt-install-url-div">');

        var arm64 = Dynamsoft.navInfo.bArm64,
          mips64 = Dynamsoft.navInfo.bMips64,
          chromeOS = Dynamsoft.navInfoSync.bChromeOS,
          harmonyOS = Dynamsoft.navInfoSync.bHarmonyOS;

        if (arm64 || mips64 || chromeOS || harmonyOS) { } else {
          ObjString.push('<div><input id="dwt-install-url-deb" name="dwt-install-url" type="radio" onclick="Dynamsoft._dwt_change_install_url(\'' + objInstallerUrl.deb + '\')" checked="checked" /><label for="dwt-install-url-deb">64 bit .deb (For Ubuntu/Debian)</label></div>');
          ObjString.push('<div><input id="dwt-install-url-rpm" name="dwt-install-url" type="radio" onclick="Dynamsoft._dwt_change_install_url(\'' + objInstallerUrl.rpm + '\')" /><label for="dwt-install-url-rpm">64 bit .rpm (For Fedora)</label></div>');
        }
        ObjString.push('</div></div>');
      }

      ObjString.push('<div class="ds-download-div"><a id="dwt-btn-install" target="_blank" href="');
      ObjString.push(objInstallerUrl['default']);
      ObjString.push('"');
      if (bHTML5) {
        ObjString.push(' html5="1"');
      } else {
        ObjString.push(' html5="0"');
      }

      ObjString.push(' onclick="Dynamsoft._dcp_dwt_onclickDownloadButton()">Download</a></div>');
      if (bHTML5) {
        if (bIE) {
          ObjString.push('<div class="dynamsoft-dwt-dlg-tail" style="text-align:left; padding-left: 80px">');
          ObjString.push('If you still see the dialog after installing the Dynamic Web TWAIN Service, please<br />');
          ObjString.push('1. Add the website to the zone of trusted sites.<br />');
          ObjString.push('IE | Tools | Internet Options | Security | Trusted Sites.<br />');
          ObjString.push('2. Refresh your browser.');
          ObjString.push('</div>');

        } else {

          if (bUnix) {
            ObjString.push('<div class="dynamsoft-dwt-dlg-tail">');
            ObjString.push('<div class="dynamsoft-dwt-dlg-red">After the installation, please <strong>' + browserActionNeeded + '</strong>  your browser.</div>');
            ObjString.push('</div>');
          } else {
            ObjString.push('<div><br /></div>');
          }
        }

      } else {
        ObjString.push('<div class="dynamsoft-dwt-dlg-tail" style="text-align:left; padding-left: 80px">');
        ObjString.push('After the installation, please<br />');
        ObjString.push('1. Restart the browser<br />');
        ObjString.push('2. Allow "DynamicWebTWAIN" add-on to run by right clicking on the Information Bar in the browser.');
        ObjString.push('</div>');
      }
      _this.DWT.ShowMessage(ObjString.join(''), {
        width: promptDlgWidth,
        headerStyle: 1
      });
    } else {
      console.log("The Dynamsoft namespace is missing");
    }

    if (Dynamsoft.DWT && Dynamsoft.DWT.OnWebTwainNotFound) {
      Dynamsoft.DWT.OnWebTwainNotFound();
    }
  };

  Dynamsoft._dwt_change_install_url = function (url) {
    var install = document.getElementById('dwt-btn-install');
    if (install)
      install.href = url;
  };

  var reconnectTime = 0;
  Dynamsoft._dcp_dwt_onclickDownloadButton = function() {
    var install = document.getElementById('dwt-install-url-div');
    if (install)
      install.style.display = 'none';

    var el = document.getElementById('dwt-btn-install');
    if (el) {
      if (el.getAttribute("html5") == "1") {
        var pel = el.parentNode,
        newDiv = document.createElement('div');
        newDiv.id = 'dwt-btn-install';
        newDiv.style.textAlign = "center";
        newDiv.style.paddingBottom = '15px';
        newDiv.style.fontSize = '14px';
        newDiv.innerHTML = 'Please proceed with the installation. Once done, <a href="javascript:void(0)" onclick="Dynamsoft._dcp_dwt_onclickInstallButton()">click here to verify completion.</a>';
        newDiv.setAttribute("html5", "1");
        pel.removeChild(el);
        pel.appendChild(newDiv);
      } else {
        var pel = el.parentNode;
        pel.removeChild(el);
      }
    }
    return true;
  };
  Dynamsoft._dcp_dwt_onclickInstallButton = function () {
    var install = document.getElementById('dwt-install-url-div');
    if (install)
      install.style.display = 'none';

    var divTitle = Dynamsoft.Lib.one('.dynamsoft-dwt-dlg-title');
    if (divTitle) {
      divTitle.style('display','');
    }
    var divTitleErr = Dynamsoft.Lib.one('.dynamsoft-dwt-dlg-title-error');
    if (divTitleErr) {
      divTitleErr.style('display','none');
    }

    var el = document.getElementById('dwt-btn-install');
    if (el) {
      setTimeout(function () {
        if (el.getAttribute("html5") == "1") {
          var pel = el.parentNode,
            newDiv = document.createElement('div');
          newDiv.id = 'dwt-btn-install';
          newDiv.style.textAlign = "center";
          newDiv.style.paddingBottom = '15px';
          newDiv.style.fontSize = '14px';
          
          newDiv.innerHTML = 'Connecting to the service...';
          newDiv.setAttribute("html5", "1");
          pel.removeChild(el);
          pel.appendChild(newDiv);
          reconnectTime = new Date();
          setTimeout(Dynamsoft._dwt_Reconnect, 10);
        } else {
          var pel = el.parentNode;
          pel.removeChild(el);
        }
      }, 10);
    }
    return true;
  };

  Dynamsoft._dwt_Reconnect = function () {
    var _this = Dynamsoft;
    if (((new Date() - reconnectTime) / 1000) > 10) {
      // change prompt
      var el = document.getElementById('dwt-btn-install');
      if (el) {
        el.innerHTML = 'Please make sure your installation is successful. <a href="javascript:void(0)" onclick="Dynamsoft._dcp_dwt_onclickInstallButton()">Click here to try reconnecting</a>.';
      }

      var divTitle = Dynamsoft.Lib.one('.dynamsoft-dwt-dlg-title');
      if (divTitle) {
        divTitle.style('display','none');
      }
      var divTitleErr = Dynamsoft.Lib.one('.dynamsoft-dwt-dlg-title-error');
      if (divTitleErr) {
        divTitleErr.html('Failed to connect to the service!');
        divTitleErr.style('display','');
      }

      return;
    }
    if (_this.DWT) {

      var _timeSpan = 500;
      if (navigator.userAgent.indexOf("Safari") > -1) {
        _timeSpan = 2000;
      }

      _this.DWT.CheckConnectToTheService(function () {
        Dynamsoft.DWT.CloseDialog();
        Dynamsoft.DWT.ConnectToTheService();
      }, function () {
        if (Dynamsoft.DWT.NeedCheckWebTwainBySocket()) {
          Dynamsoft.DWT.CheckWebTwainBySocket(function () {
            Dynamsoft.OnHTTPCorsError();
          }, function () {
            setTimeout(Dynamsoft._dwt_Reconnect, _timeSpan);
          }, function () {
            setTimeout(Dynamsoft._dwt_Reconnect, _timeSpan);
          });
          return;
        }
        setTimeout(Dynamsoft._dwt_Reconnect, _timeSpan);
      });
    } else {
      console.log("The Dynamsoft namespace is missing");
    }
  };

  Dynamsoft._show_android_install_dialog = function (objInstallerUrl, bUpgrade) {
    var ObjString;

    if (Dynamsoft.DWT.bNpm && Dynamsoft.navInfoSync.bFileSystem) {
      return Dynamsoft._show_online_download_dialog(objInstallerUrl, bHTML5, iPlatform);
    }

    ObjString = [];

    if (Dynamsoft.DWT) {

      ObjString.push('<div class="ds-dwt-ui-dlg-android">');

      ObjString.push('<div>Please download and ');

      if(bUpgrade) {
        ObjString.push('update');
      } else {
        ObjString.push('install');
      }

        ObjString.push(' the <strong>DYNAMIC WEB TWAIN SERVICE</strong> app via the </div>');

      ObjString.push('<div><a target="_blank" href="');
      ObjString.push(objInstallerUrl['default']);
      ObjString.push('" onclick="Dynamsoft._dwt_ReconnectForAndroid()">direct APK download link</a>.</div>');
      ObjString.push('</div>');

      ObjString.push('<div class="dynamsoft-dwt-dlg-tail" style="text-align:left">');
      ObjString.push('If you have ');
      
      if(bUpgrade) {
        ObjString.push('updated');
      } else {
        ObjString.push('installed');
      }
      
      ObjString.push(' it, please click on the button below to initiate the connection.');

      ObjString.push('<a target="_blank" href="');
      ObjString.push(objInstallerUrl.openService);
      ObjString.push('" onclick="Dynamsoft._dwt_ReconnectForAndroid()" class="dynamsoft-dwt-dlg-button-android"><div>Open Service</div></a>');

      ObjString.push('</div>');

      ObjString.push('</div>');

      Dynamsoft.DWT.ShowMessage(ObjString.join(''), {
        width: 335,
        headerStyle: 1,
        backgroundStyle: 1
      });
    } else {
      console.log("The Dynamsoft namespace is missing");
    }

    if (Dynamsoft.DWT && Dynamsoft.DWT.OnWebTwainNotFound) {
      Dynamsoft.DWT.OnWebTwainNotFound();
    }
  };

  Dynamsoft._dwt_ReconnectForAndroid = function () {
    Dynamsoft.DWT.CheckConnectToTheService(function (bConnected) {
      if (bConnected) {
        Dynamsoft.DWT.CloseDialog();
        Dynamsoft.DWT.ConnectToTheService();
      } else {
        setTimeout(Dynamsoft._dwt_ReconnectForAndroid, 500);
      }

    }, function () {
      setTimeout(Dynamsoft._dwt_ReconnectForAndroid, 500);
    });
  }

  //Dynamsoft.OnWebTwainNotFoundOnAndroidCallback = Dynamsoft.MobileNotSupportCallback;
  //------------------------end Install Dilaog---------------------------


  //----------------------start Upgrade Dialog---------------------------

  Dynamsoft.OnWebTwainNeedUpgradeCallback = function (ProductName, objInstallerUrl, bHTML5, iPlatform, bIE, bSafari, bSSL, strIEVersion) {
    Dynamsoft._show_install_dialog(ProductName, objInstallerUrl, bHTML5, iPlatform, bIE, bSafari, bSSL, strIEVersion, true, true);
  };

  Dynamsoft.OnWebTwainNeedUpgradeOnAndroidCallback = function (ProductName, InstallerUrl, bSSL) {
    Dynamsoft.OnWebTwainNotFoundOnAndroidCallback(ProductName, InstallerUrl, bSSL, true);
  };

  //----------------------end Upgrade Dialog---------------------------

  //----------------------start DLS License -----------------------
  Dynamsoft.OnLTSLicenseError = function (message, code) {

    var addMessage = '',
      ObjString;

    if (code == -2440 || // NetworkError
      code == -2441 || // Timedout
      code == -2443 || // CorsError
      code == -2446 || // LtsJsLoadError
      message.indexOf('Internet connection') > -1 ||
      message.indexOf('Storage') > -1) {

      var purchaseUrl = 'https://www.dynamsoft.com/customer/license/trialLicense?product=dwt&deploymenttype=js';
      addMessage = '<div>You can register for a free 30-day trial <a href="' + purchaseUrl + '" target="_blank" class="dynamsoft-major-color">here</a>. Make sure to select the product Dynamic Web TWAIN.</div>';
    }

    ObjString = [
      message,
      addMessage
    ];

    Dynamsoft.DWT.ShowMessage(ObjString.join(''), {
      width: promptDlgWidth,
      headerStyle: 2
    });
  };

  Dynamsoft.OnLTSConnectionWarning = function () {

    var ObjString = [
      'Warning: You are seeing this dialog because Dynamic Web TWAIN has failed to connect to the License Tracking Server. ',
      'A cached authorization is being used, and you can continue to use the software as usual. ',
      'Please get connected to the network as soon as possible. ',
      Dynamsoft.DWT.isPublicLicense() ? '<a class="dynamsoft-major-color" href="https://www.dynamsoft.com/company/contact/">Contact Dynamsoft</a> ' : 'Contact the site administrator ',
      'for more information.'
    ].join('');

    Dynamsoft.DWT.ShowMessage(ObjString, {
      width: promptDlgWidth,
      caption: 'Warning',
      headerStyle: 2
    });
  };

  Dynamsoft.OnLTSPublicLicenseWarning = function (message) {

    Dynamsoft.DWT.ShowMessage(message, {
      width: promptDlgWidth,
      caption: 'Warning',
      headerStyle: 2
    });
  };

  //--------------------end DLS License-------------------------------

  //----------------------start Product Key -----------------------
  Dynamsoft.OnLicenseExpiredWarning = function (strExpiredDate, remain, trial) {

    var ObjString, strCaption,
      a_online_store = '<a target="_blank" href="https://www.dynamsoft.com/store/dynamic-web-twain/#DynamicWebTWAIN">online store</a>',
      a_new_key_href = 'https://www.dynamsoft.com/customer/license/trialLicense?product=dwt&utm_source=in-product';

    if (remain > 5 || !trial) {

    } else {

      if (remain > 0) { // 1~5

        var strDays;

        if (remain <= 1) {
          strDays = '1 day';
        } else {
          strDays = parseInt(remain) + ' days';
        }

        strCaption = 'Warning';
        ObjString = [
          '<div style="padding:0 0 10px 0">Kindly note your trial key is expiring in ', strDays, '. Two quick steps to extend your trial:</div>',
          '<div style="margin:0 0 0 10px">1. <a target="_blank" href="', a_new_key_href, '">Request a new trial key</a> and follow the instructions to set the new key</div>',
          '<div style="margin:0 0 0 10px">2. Refresh your scan page and try again</div>',
          '<div style="padding:0">If you are ready to purchase a full license, please go to the ', a_online_store, '.</div>'
        ].join('');

      } else {
        
        // Trial remain<=0 Expired
        ObjString = [
          '<div style="padding:0">Sorry. Your product key has expired on ', strExpiredDate, '. You can purchase a full license at the ', a_online_store, '.</div>',
          '<div style="padding:0">Or, you can try requesting a new product key at <a target="_blank" href="', a_new_key_href, '">this page</a>.</div>'
        ].join('');

      }
      
      if (ObjString) {
        Dynamsoft.DWT.ShowMessage(ObjString, {
          width: promptDlgWidth,
          caption: strCaption,
          headerStyle: 2
        });
      }
    } 

  };

  Dynamsoft.OnLicenseError = Dynamsoft.OnLicenseError || function (message, errorCode) {

    Dynamsoft.DWT.ShowMessage(Dynamsoft.ProcessLicenseErrorContent(message), {
      width: promptDlgWidth,
      headerStyle: 2
    });

  };
  
  Dynamsoft.OnCorsConfigError = function (msg) {

    var ObjString = [
      msg, " Please contact the Administrator to configure 'Access-Control-Allow-Origin'.",
    ].join('');

    Dynamsoft.DWT.ShowMessage(ObjString, {
      width: promptDlgWidth,
      headerStyle: 2
    });
  };

  Dynamsoft.ProcessLicenseErrorContent = function (content) {
    var el = [],
      _content = content;
    if (typeof(_content) != 'string') {
      if (undefined === _content)
        return '';
      if (_content instanceof Error || 'message' in _content)
        _content = _content.message;
      else
        _content = '' + _content;
    }

    var posLeftBracket = _content.indexOf("[");
    var posRightBracket = _content.indexOf("]", posLeftBracket);
    var posLeftParentheses = _content.indexOf("(", posRightBracket);
    var posRightParentheses = _content.indexOf(")", posLeftParentheses);
    if (-1 == posLeftBracket || -1 == posRightBracket || -1 == posLeftParentheses || -1 == posRightParentheses) {
      return _content;
    }

    if (posLeftBracket > 0) {
      el.push(_content.substring(0, posLeftBracket));
    }

    var linkText = _content.substring(posLeftBracket + 1, posRightBracket);
    var linkAddr = _content.substring(posLeftParentheses + 1, posRightParentheses);

    el.push(['<a href="', linkAddr, '" target="_blank" class="dynamsoft-major-color">', linkText, '</a>'].join(''));
    el.push(_content.substring(posRightParentheses + 1));

    return el.join('');
  }
  //--------------------end Product Key-------------------------------


})();