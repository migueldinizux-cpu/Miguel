// Aquário Pixel — janela nativa (WinForms + WebView2) que hospeda o aquário em web/index.html
// Compilado pelo build.ps1 com o csc do .NET Framework (sintaxe C# 5).
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Win32;

[assembly: System.Reflection.AssemblyTitle("Aquario Pixel")]
[assembly: System.Reflection.AssemblyDescription("Aquario em pixel art para a area de trabalho")]
[assembly: System.Reflection.AssemblyProduct("Aquario Pixel")]
[assembly: System.Reflection.AssemblyVersion("2.0.0.0")]
[assembly: System.Reflection.AssemblyFileVersion("2.0.0.0")]

namespace AquarioPixel
{
    static class NativeMethods
    {
        public static readonly int WM_SHOWME = RegisterWindowMessage("AQUARIO_PIXEL_SHOWME");
        [DllImport("user32.dll")] public static extern int RegisterWindowMessage(string msg);
        [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr hwnd, int msg, IntPtr w, IntPtr l);
        [DllImport("user32.dll")] public static extern bool ReleaseCapture();
        [DllImport("user32.dll")] public static extern IntPtr SendMessage(IntPtr hwnd, int msg, IntPtr w, IntPtr l);
        [DllImport("dwmapi.dll")] public static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int value, int size);
        [DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(IntPtr value);
    }

    static class Program
    {
        [STAThread]
        static void Main()
        {
            // nitidez em telas com escala (125%, 150%...): sem isso o Windows estica a janela e borra os pixels
            try { NativeMethods.SetProcessDpiAwarenessContext((IntPtr)(-4)); } catch { }
            bool created;
            using (Mutex m = new Mutex(true, "AquarioPixel.InstanciaUnica", out created))
            {
                if (!created)
                {
                    NativeMethods.PostMessage((IntPtr)0xffff, NativeMethods.WM_SHOWME, IntPtr.Zero, IntPtr.Zero);
                    return;
                }
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                Application.Run(new MainForm());
            }
        }
    }

    class Settings
    {
        public int X = -1, Y = -1, W = 1120, H = 640, Fish = 30, Fps = 30, Sound = 1;
        public bool Widget = false, TopMost = false, Maximized = false;
        public string TimeMode = "auto";

        static string Dir { get { return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "AquarioPixel"); } }
        static string FilePath { get { return Path.Combine(Dir, "config.ini"); } }

        public static Settings Load()
        {
            Settings s = new Settings();
            try
            {
                if (!File.Exists(FilePath)) return s;
                foreach (string line in File.ReadAllLines(FilePath))
                {
                    int i = line.IndexOf('=');
                    if (i < 1) continue;
                    string k = line.Substring(0, i).Trim(), v = line.Substring(i + 1).Trim();
                    switch (k)
                    {
                        case "x": int.TryParse(v, out s.X); break;
                        case "y": int.TryParse(v, out s.Y); break;
                        case "w": int.TryParse(v, out s.W); break;
                        case "h": int.TryParse(v, out s.H); break;
                        case "fish": int.TryParse(v, out s.Fish); break;
                        case "fps": int.TryParse(v, out s.Fps); break;
                        case "sound": int.TryParse(v, out s.Sound); break;
                        case "widget": s.Widget = v == "1"; break;
                        case "topmost": s.TopMost = v == "1"; break;
                        case "maximized": s.Maximized = v == "1"; break;
                        case "time": s.TimeMode = v; break;
                    }
                }
            }
            catch { }
            if (s.W < 320) s.W = 1120;
            if (s.H < 200) s.H = 640;
            return s;
        }

        public void Save()
        {
            try
            {
                Directory.CreateDirectory(Dir);
                File.WriteAllLines(FilePath, new string[] {
                    "x=" + X, "y=" + Y, "w=" + W, "h=" + H, "fish=" + Fish, "fps=" + Fps, "sound=" + Sound,
                    "widget=" + (Widget ? "1" : "0"), "topmost=" + (TopMost ? "1" : "0"), "maximized=" + (Maximized ? "1" : "0"), "time=" + TimeMode });
            }
            catch { }
        }
    }

    class DarkColors : ProfessionalColorTable
    {
        static readonly Color Bg = Color.FromArgb(14, 34, 58), Hi = Color.FromArgb(34, 84, 128), Br = Color.FromArgb(44, 76, 108);
        public override Color ToolStripDropDownBackground { get { return Bg; } }
        public override Color ImageMarginGradientBegin { get { return Bg; } }
        public override Color ImageMarginGradientMiddle { get { return Bg; } }
        public override Color ImageMarginGradientEnd { get { return Bg; } }
        public override Color MenuBorder { get { return Br; } }
        public override Color MenuItemBorder { get { return Hi; } }
        public override Color MenuItemSelected { get { return Hi; } }
        public override Color MenuItemSelectedGradientBegin { get { return Hi; } }
        public override Color MenuItemSelectedGradientEnd { get { return Hi; } }
        public override Color MenuItemPressedGradientBegin { get { return Hi; } }
        public override Color MenuItemPressedGradientEnd { get { return Hi; } }
        public override Color SeparatorDark { get { return Br; } }
        public override Color SeparatorLight { get { return Bg; } }
        public override Color CheckBackground { get { return Bg; } }
        public override Color CheckSelectedBackground { get { return Hi; } }
        public override Color CheckPressedBackground { get { return Hi; } }
    }

    class DarkRenderer : ToolStripProfessionalRenderer
    {
        public DarkRenderer() : base(new DarkColors()) { }
        protected override void OnRenderItemCheck(ToolStripItemImageRenderEventArgs e)
        {
            Rectangle r = e.ImageRectangle;
            e.Graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
            using (Pen p = new Pen(Color.FromArgb(140, 230, 255), 2f))
                e.Graphics.DrawLines(p, new Point[] { new Point(r.Left + 3, r.Top + r.Height / 2), new Point(r.Left + r.Width / 2 - 1, r.Bottom - 4), new Point(r.Right - 3, r.Top + 3) });
        }
        protected override void OnRenderArrow(ToolStripArrowRenderEventArgs e) { e.ArrowColor = Color.FromArgb(200, 230, 250); base.OnRenderArrow(e); }
        protected override void OnRenderItemText(ToolStripItemTextRenderEventArgs e) { e.TextColor = Color.FromArgb(222, 240, 252); base.OnRenderItemText(e); }
    }

    class MainForm : Form
    {
        const string RunKey = @"Software\Microsoft\Windows\CurrentVersion\Run";
        readonly string appDir = AppDomain.CurrentDomain.BaseDirectory;
        readonly Settings cfg;
        WebView2 web;
        NotifyIcon tray;
        ContextMenuStrip menu;
        ToolStripMenuItem miWidget, miTop, miFull, miStartup;
        readonly List<ToolStripMenuItem> timeItems = new List<ToolStripMenuItem>(), fishItems = new List<ToolStripMenuItem>(), fpsItems = new List<ToolStripMenuItem>(), soundItems = new List<ToolStripMenuItem>();
        bool fullscreen;
        Rectangle restoreBounds;
        FormBorderStyle restoreStyle;

        public MainForm()
        {
            cfg = Settings.Load();
            Text = "Aquário Pixel";
            try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }
            BackColor = Color.FromArgb(6, 24, 46);
            MinimumSize = new Size(320, 200);
            StartPosition = FormStartPosition.Manual;
            Rectangle b = new Rectangle(cfg.X, cfg.Y, cfg.W, cfg.H);
            if (cfg.X == -1 || !OnScreen(b))
            {
                Rectangle wa = Screen.PrimaryScreen.WorkingArea;
                b = new Rectangle(wa.X + (wa.Width - cfg.W) / 2, wa.Y + (wa.Height - cfg.H) / 2, cfg.W, cfg.H);
            }
            Bounds = b;
            TopMost = cfg.TopMost;
            if (cfg.Widget) FormBorderStyle = FormBorderStyle.None;

            web = new WebView2();
            web.Dock = DockStyle.Fill;
            web.DefaultBackgroundColor = Color.FromArgb(6, 24, 46);
            web.CreationProperties = new CoreWebView2CreationProperties();
            web.CreationProperties.AdditionalBrowserArguments = "--autoplay-policy=no-user-gesture-required";
            web.CreationProperties.UserDataFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "AquarioPixel", "WebView2");
            Controls.Add(web);

            BuildMenu();
            tray = new NotifyIcon();
            tray.Icon = Icon;
            tray.Text = "Aquário Pixel";
            tray.ContextMenuStrip = menu;
            tray.Visible = true;
            tray.DoubleClick += delegate { ShowFront(); };

            if (cfg.Maximized) WindowState = FormWindowState.Maximized;
            Load += async delegate { await InitWeb(); };
        }

        static bool OnScreen(Rectangle r)
        {
            foreach (Screen s in Screen.AllScreens) if (s.WorkingArea.IntersectsWith(new Rectangle(r.X, r.Y, Math.Max(80, r.Width / 3), 60))) return true;
            return false;
        }

        async Task InitWeb()
        {
            string index = Path.Combine(appDir, "web", "index.html");
            if (!File.Exists(index))
            {
                MessageBox.Show("Não encontrei a pasta \"web\" ao lado do programa.\n\nEsperado em: " + index, "Aquário Pixel", MessageBoxButtons.OK, MessageBoxIcon.Error);
                Close(); return;
            }
            try { await web.EnsureCoreWebView2Async(null); }
            catch (Exception ex)
            {
                MessageBox.Show("Não consegui iniciar o motor do navegador (WebView2).\n\n" + ex.Message, "Aquário Pixel", MessageBoxButtons.OK, MessageBoxIcon.Error);
                Close(); return;
            }
            CoreWebView2Settings s = web.CoreWebView2.Settings;
            s.AreDefaultContextMenusEnabled = false;
            s.AreDevToolsEnabled = false;
            s.IsStatusBarEnabled = false;
            s.IsZoomControlEnabled = false;
            s.AreBrowserAcceleratorKeysEnabled = false;
            web.CoreWebView2.WebMessageReceived += OnWebMessage;
            web.CoreWebView2.Navigate(new Uri(index).AbsoluteUri);
        }

        void OnWebMessage(object sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            string msg;
            try { msg = e.TryGetWebMessageAsString(); } catch { return; }
            Match m = Regex.Match(msg ?? "", "\"t\"\\s*:\\s*\"(\\w+)\"");
            if (!m.Success) return;
            switch (m.Groups[1].Value)
            {
                case "ready": PushSettings(); break;
                case "menu": SyncChecks(); menu.Show(Cursor.Position); break;
                case "drag":
                    if (!fullscreen) { NativeMethods.ReleaseCapture(); NativeMethods.SendMessage(Handle, 0xA1, (IntPtr)2, IntPtr.Zero); }
                    break;
                case "resize":
                    if (!fullscreen) { NativeMethods.ReleaseCapture(); NativeMethods.SendMessage(Handle, 0xA1, (IntPtr)17, IntPtr.Zero); }
                    break;
                case "sound":
                    { Match v = Regex.Match(msg, "\"v\"\\s*:\\s*(\\d)"); int lv; if (v.Success && int.TryParse(v.Groups[1].Value, out lv)) { cfg.Sound = Math.Max(0, Math.Min(3, lv)); cfg.Save(); } }
                    break;
                case "fullscreen": ToggleFullscreen(); break;
                case "escape": if (fullscreen) ToggleFullscreen(); break;
                case "maximize": if (!fullscreen) WindowState = WindowState == FormWindowState.Maximized ? FormWindowState.Normal : FormWindowState.Maximized; break;
            }
        }

        void Send(string obj)
        {
            if (web != null && web.CoreWebView2 != null) web.CoreWebView2.ExecuteScriptAsync("window.AQ_host && AQ_host(" + obj + ")");
        }

        void PushSettings()
        {
            Send("{timeMode:'" + cfg.TimeMode + "',fishCount:" + cfg.Fish + ",fps:" + cfg.Fps + ",sound:" + cfg.Sound + ",widget:" + (cfg.Widget && !fullscreen ? "true" : "false") + "}");
        }

        ToolStripMenuItem Item(string text, EventHandler onClick)
        {
            ToolStripMenuItem it = new ToolStripMenuItem(text);
            it.ForeColor = Color.FromArgb(222, 240, 252);
            if (onClick != null) it.Click += onClick;
            return it;
        }

        void BuildMenu()
        {
            menu = new ContextMenuStrip();
            menu.Renderer = new DarkRenderer();
            menu.ShowImageMargin = true;
            miWidget = Item("Modo widget (sem borda)", delegate { SetWidget(!cfg.Widget); });
            miTop = Item("Sempre no topo", delegate { cfg.TopMost = !cfg.TopMost; TopMost = cfg.TopMost; cfg.Save(); });
            miFull = Item("Tela cheia", delegate { ToggleFullscreen(); });
            miFull.ShortcutKeyDisplayString = "F11";
            menu.Items.Add(miWidget); menu.Items.Add(miTop); menu.Items.Add(miFull);
            menu.Items.Add(new ToolStripSeparator());

            ToolStripMenuItem time = Item("Hora do dia", null);
            string[][] times = { new string[] { "auto", "Automática (relógio do PC)" }, new string[] { "day", "Sempre dia" }, new string[] { "dusk", "Sempre entardecer" }, new string[] { "night", "Sempre noite" } };
            foreach (string[] t in times)
            {
                string key = t[0];
                ToolStripMenuItem it = Item(t[1], delegate { cfg.TimeMode = key; Send("{timeMode:'" + key + "'}"); cfg.Save(); });
                it.Tag = key; timeItems.Add(it); time.DropDownItems.Add(it);
            }
            ToolStripMenuItem fishM = Item("Quantidade de peixes", null);
            int[] counts = { 16, 30, 50, 72 };
            string[] names = { "Poucos", "Normal", "Muitos", "Cardume enorme" };
            for (int i = 0; i < counts.Length; i++)
            {
                int n = counts[i];
                ToolStripMenuItem it = Item(names[i], delegate { cfg.Fish = n; Send("{fishCount:" + n + "}"); cfg.Save(); });
                it.Tag = n; fishItems.Add(it); fishM.DropDownItems.Add(it);
            }
            ToolStripMenuItem fpsM = Item("Fluidez", null);
            foreach (int f in new int[] { 20, 30, 60 })
            {
                int v = f;
                ToolStripMenuItem it = Item(v == 20 ? "20 fps (econômico)" : v == 30 ? "30 fps (normal)" : "60 fps (mais suave)", delegate { cfg.Fps = v; Send("{fps:" + v + "}"); cfg.Save(); });
                it.Tag = v; fpsItems.Add(it); fpsM.DropDownItems.Add(it);
            }
            ToolStripMenuItem sndM = Item("Som", null);
            string[] sl = { "Desligado", "Baixo", "Médio", "Alto" };
            for (int i = 0; i < sl.Length; i++)
            {
                int v = i;
                ToolStripMenuItem it = Item(sl[i], delegate { cfg.Sound = v; Send("{sound:" + v + ",soundToast:true}"); cfg.Save(); });
                it.Tag = v; soundItems.Add(it); sndM.DropDownItems.Add(it);
            }
            menu.Items.Add(time); menu.Items.Add(fishM); menu.Items.Add(fpsM); menu.Items.Add(sndM);
            menu.Items.Add(new ToolStripSeparator());

            ToolStripMenuItem visit = Item("Chamar visitante", null);
            string[][] vis = {
                new string[] { "dolphins", "Golfinhos" }, new string[] { "humpback", "Baleia-jubarte e filhote" }, new string[] { "orca", "Orcas" },
                new string[] { "sperm", "Cachalote" }, new string[] { "narwhal", "Narvais" }, new string[] { "sealion", "Leão-marinho" },
                new string[] { "manatee", "Peixe-boi" }, new string[] { "turtle", "Tartaruga-marinha" }, new string[] { "manta", "Raia-manta" },
                new string[] { "barracuda", "Barracudas" }, null,
                new string[] { "mermaid", "Sereia (Iara)" }, new string[] { "boto", "Boto encantado" }, new string[] { "hippocampus", "Hipocampo" },
                new string[] { "leviathan", "Leviatã" }, new string[] { "kraken", "Kraken" }, new string[] { "zaratan", "Tartaruga-ilha" } };
            foreach (string[] v in vis)
            {
                if (v == null) { visit.DropDownItems.Add(new ToolStripSeparator()); continue; }
                string key = v[0];
                visit.DropDownItems.Add(Item(v[1], delegate { Send("{spawn:'" + key + "'}"); }));
            }
            menu.Items.Add(visit);
            ToolStripMenuItem petM = Item("Bichinho", null);
            petM.DropDownItems.Add(Item("Opções do bichinho…", delegate { Send("{pet:'options'}"); }));
            petM.DropDownItems.Add(Item("Guarda-roupa…", delegate { Send("{pet:'wardrobe'}"); }));
            petM.DropDownItems.Add(Item("Minijogos (ganhar moedas)…", delegate { Send("{pet:'games'}"); }));
            petM.DropDownItems.Add(Item("Aquapédia e conquistas…", delegate { Send("{pet:'pedia'}"); }));
            petM.DropDownItems.Add(Item("Modo caçador (liga / desliga)", delegate { Send("{pet:'hunt'}"); }));
            petM.DropDownItems.Add(Item("Mandar caçar agora", delegate { Send("{pet:'huntNow'}"); }));
            petM.DropDownItems.Add(Item("Chamar para perto", delegate { Send("{pet:'call'}"); }));
            petM.DropDownItems.Add(Item("Mostrar / ocultar painel", delegate { Send("{pet:'hud'}"); }));
            ToolStripMenuItem speedM = Item("Ritmo de crescimento", null);
            string[] speeds = { "Normal (alguns dias)", "Rápido (uma tarde)", "Muito rápido (menos de 1 hora)" };
            for (int i = 0; i < speeds.Length; i++) { int v = i; speedM.DropDownItems.Add(Item(speeds[i], delegate { Send("{pet:'speed',v:" + v + "}"); })); }
            petM.DropDownItems.Add(speedM);
            petM.DropDownItems.Add(Item("Renomear…", delegate { Send("{pet:'rename'}"); }));
            petM.DropDownItems.Add(new ToolStripSeparator());
            petM.DropDownItems.Add(Item("Recomeçar do ovo (escolher espécie)…", delegate { Send("{pet:'reset'}"); }));
            menu.Items.Add(petM);
            menu.Items.Add(new ToolStripSeparator());
            miStartup = Item("Iniciar com o Windows", delegate { ToggleStartup(); });
            menu.Items.Add(miStartup);
            menu.Items.Add(Item("Mostrar / trazer para frente", delegate { ShowFront(); }));
            menu.Items.Add(Item("Sair", delegate { Close(); }));
            menu.Opening += delegate { SyncChecks(); };
        }

        void SyncChecks()
        {
            miWidget.Checked = cfg.Widget;
            miTop.Checked = cfg.TopMost;
            miFull.Checked = fullscreen;
            miStartup.Checked = StartupEnabled();
            foreach (ToolStripMenuItem it in timeItems) it.Checked = (string)it.Tag == cfg.TimeMode;
            foreach (ToolStripMenuItem it in fishItems) it.Checked = (int)it.Tag == cfg.Fish;
            foreach (ToolStripMenuItem it in fpsItems) it.Checked = (int)it.Tag == cfg.Fps;
            foreach (ToolStripMenuItem it in soundItems) it.Checked = (int)it.Tag == cfg.Sound;
        }

        void SetWidget(bool on)
        {
            if (fullscreen) ToggleFullscreen();
            cfg.Widget = on;
            FormBorderStyle = on ? FormBorderStyle.None : FormBorderStyle.Sizable;
            ApplyDwm();
            Send("{widget:" + (on ? "true,toast:'Widget: arraste pela faixa de cima, redimensione pelo canto inferior direito'" : "false") + "}");
            cfg.Save();
        }

        void ToggleFullscreen()
        {
            if (!fullscreen)
            {
                restoreBounds = WindowState == FormWindowState.Normal ? Bounds : RestoreBounds;
                restoreStyle = FormBorderStyle;
                WindowState = FormWindowState.Normal;
                FormBorderStyle = FormBorderStyle.None;
                Bounds = Screen.FromControl(this).Bounds;
                fullscreen = true;
                Send("{widget:false,toast:'Esc ou F11 para sair da tela cheia'}");
            }
            else
            {
                fullscreen = false;
                FormBorderStyle = restoreStyle;
                Bounds = restoreBounds;
                ApplyDwm();
                Send("{widget:" + (cfg.Widget ? "true" : "false") + "}");
            }
        }

        static bool StartupEnabled()
        {
            try { using (RegistryKey k = Registry.CurrentUser.OpenSubKey(RunKey)) return k != null && k.GetValue("AquarioPixel") != null; }
            catch { return false; }
        }

        void ToggleStartup()
        {
            try
            {
                using (RegistryKey k = Registry.CurrentUser.OpenSubKey(RunKey, true))
                {
                    if (k == null) return;
                    if (k.GetValue("AquarioPixel") != null) { k.DeleteValue("AquarioPixel", false); Send("{toast:'Não vai mais abrir com o Windows'}"); }
                    else { k.SetValue("AquarioPixel", "\"" + Application.ExecutablePath + "\""); Send("{toast:'Vai abrir junto com o Windows'}"); }
                }
            }
            catch (Exception ex) { MessageBox.Show(ex.Message, "Aquário Pixel"); }
        }

        void ShowFront()
        {
            Show();
            if (WindowState == FormWindowState.Minimized) WindowState = FormWindowState.Normal;
            Activate();
            bool top = TopMost; TopMost = true; TopMost = top;
        }

        void ApplyDwm()
        {
            if (!IsHandleCreated) return;
            try
            {
                int dark = 1; NativeMethods.DwmSetWindowAttribute(Handle, 20, ref dark, 4);        // barra escura
                int caption = 0x0040240B; NativeMethods.DwmSetWindowAttribute(Handle, 35, ref caption, 4); // cor da barra (azul-fundo)
                int text = 0x00FAEEDC; NativeMethods.DwmSetWindowAttribute(Handle, 36, ref text, 4);
                int corner = 2; NativeMethods.DwmSetWindowAttribute(Handle, 33, ref corner, 4);     // cantos arredondados
            }
            catch { }
        }

        protected override void OnHandleCreated(EventArgs e) { base.OnHandleCreated(e); ApplyDwm(); }

        protected override void WndProc(ref Message m)
        {
            if (m.Msg == NativeMethods.WM_SHOWME) ShowFront();
            base.WndProc(ref m);
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            if (!fullscreen)
            {
                cfg.Maximized = WindowState == FormWindowState.Maximized;
                Rectangle b = WindowState == FormWindowState.Normal ? Bounds : RestoreBounds;
                cfg.X = b.X; cfg.Y = b.Y; cfg.W = b.Width; cfg.H = b.Height;
            }
            cfg.Save();
            tray.Visible = false;
            tray.Dispose();
            base.OnFormClosing(e);
        }
    }
}
