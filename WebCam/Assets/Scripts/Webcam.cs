using UnityEngine;
using System.Collections;

public class Webcam : MonoBehaviour {

	public MeshRenderer[] UseWebcamTexture;
	private WebCamTexture webcamTexture;
	public string deviceName;

	// Use this for initialization
	IEnumerator Start () {
		yield return Application.RequestUserAuthorization(UserAuthorization.WebCam | UserAuthorization.Microphone);
		
		if (Application.HasUserAuthorization(UserAuthorization.WebCam | UserAuthorization.Microphone)) {
			//webcamTexture = new WebCamTexture();
			WebCamDevice[] devices = WebCamTexture.devices;
			deviceName = devices[0].name;

			webcamTexture = new WebCamTexture(deviceName, 400, 400);
			
			foreach(MeshRenderer r in UseWebcamTexture){
				r.material.mainTexture = webcamTexture;
			}
			//renderer.material.mainTexture = webcamTexture;
			UseWebcamTexture[0].renderer.material.mainTexture = webcamTexture;
			webcamTexture.Play();
		} else {
		}

	}

	void OnGUI(){
		if (webcamTexture.isPlaying) {
				if (GUILayout.Button ("Pause")) {
					webcamTexture.Pause ();
					//这个方法就是保存图片
					StartCoroutine(getTexture2d());
				}
				if (GUILayout.Button ("Stop")) {
						webcamTexture.Stop ();
				}
			StartCoroutine(getTexture2d());
		} else {
			if (GUILayout.Button ("Play")) {
				webcamTexture.Play();
			}
		}
	}

	// Update is called once per frame
	void Update () {
	
	}

	IEnumerator getTexture2d()
		
	{ // http://jingyan.baidu.com/article/cdddd41c5bc53453ca00e151.html
		
		yield return new WaitForEndOfFrame();
		
		Texture2D t = new Texture2D(200, 180);//要保存图片的大小
		
		//截取的区域
		
		t.ReadPixels(new Rect(200, 320, 200, 180), 0, 0, false);
		
		t.Apply();
		
		//把图片数据转换为byte数组
		
		byte[] byt = t.EncodeToPNG();
		
		//然后保存为图片
		Debug.Log ("Application.dataPath = " + Application.dataPath);
//		File.WriteAllBytes(Application.dataPath + “/../imgs/webcame” + Time.time + “.jpg”, byt);
		
	}
	
	// 保存文件的路径需要自己来设置，要保存的区域大家自己可以来调。

}
