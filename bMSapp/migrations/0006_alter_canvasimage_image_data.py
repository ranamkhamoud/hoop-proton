# Generated by Django 4.1.2 on 2023-04-25 20:07

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("bMSapp", "0005_canvasimage_created_at_canvasimage_title_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="canvasimage", name="image_data", field=models.TextField(),
        ),
    ]